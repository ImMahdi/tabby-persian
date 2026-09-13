import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker'
import deepClone from 'clone-deep'
import { Injectable, Inject } from '@angular/core'
import { ProfileProvider, NewTabParameters, ConfigService, SplitTabComponent, AppService, PartialProfile } from 'tabby-core'
import type { TerminalTabComponent } from './components/terminalTab.component'
import type { ShellProvider, Shell, SessionOptions, LocalProfile } from './api'

export class LocalProfilesService extends ProfileProvider<LocalProfile> {
    id = 'local'
    name = _('Local terminal')
    get settingsComponent (): any {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require('./components/localProfileSettings.component').LocalProfileSettingsComponent
        } catch {
            return null
        }
    }
    configDefaults = {
        options: {
            restoreFromPTYID: null,
            command: '',
            args: [],
            cwd: null,
            env: {
                __nonStructural: true,
            },
            width: null,
            height: null,
            shellType: null,
            pauseAfterExit: false,
            runAsAdministrator: false,
            enablePersianBidi: false,
            enableAgentMarkdown: false,
            useYekanFont: false,
        },
    }

    private app: AppService
    private config: ConfigService
    private shellProviders: ShellProvider[]

    constructor (
        app: AppService,
        config: ConfigService,
        shellProviders: ShellProvider[],
    ) {
        super()
        this.app = app
        this.config = config
        this.shellProviders = shellProviders
    }

    async getBuiltinProfiles (): Promise<PartialProfile<LocalProfile>[]> {
        const profiles: PartialProfile<LocalProfile>[] = (await this.getShells()).map(shell => ({
            id: `local:${shell.id}`,
            type: 'local',
            name: shell.name,
            icon: shell.icon,
            options: this.optionsFromShell(shell),
            isBuiltin: true,
        }))

        profiles.push({
            id: 'local:persian-agent',
            type: 'local',
            name: 'Persian & Agent Terminal',
            icon: 'fas fa-robot',
            options: {
                ...this.configDefaults.options,
                command: '',
                enablePersianBidi: true,
                enableAgentMarkdown: true,
                useYekanFont: true,
            },
            isBuiltin: true,
        })

        return profiles
    }

    async getNewTabParameters (profile: LocalProfile): Promise<NewTabParameters<TerminalTabComponent>> {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { TerminalTabComponent: TabComponent } = require('./components/terminalTab.component')
        profile = deepClone(profile)

        if (!profile.options.cwd) {
            if (this.app.activeTab instanceof TabComponent && this.app.activeTab.session) {
                profile.options.cwd = await this.app.activeTab.session.getWorkingDirectory() ?? null
            }
            if (this.app.activeTab instanceof SplitTabComponent) {
                const focusedTab = this.app.activeTab.getFocusedTab()

                if (focusedTab instanceof TabComponent && focusedTab.session) {
                    profile.options.cwd = await focusedTab.session.getWorkingDirectory() ?? null
                }
            }
        }

        return {
            type: TabComponent,
            inputs: {
                profile,
            },
        }
    }

    async getShells (): Promise<Shell[]> {
        const shellLists = await Promise.all((this.config.enabledServices ? this.config.enabledServices(this.shellProviders) : this.shellProviders).map(x => x.provide()))
        return shellLists.reduce((a, b) => a.concat(b), [])
    }

    optionsFromShell (shell: Shell): SessionOptions {
        return {
            ...this.configDefaults.options,
            command: shell.command,
            args: shell.args ?? [],
            env: shell.env,
            cwd: shell.cwd ?? null,
            shellType: shell.shellType ?? null,
        }
    }

    getSuggestedName (profile: LocalProfile): string {
        return this.getDescription(profile)
    }

    getDescription (profile: PartialProfile<LocalProfile>): string {
        return profile.options?.command ?? ''
    }
}

Injectable({ providedIn: 'root' })(LocalProfilesService)

