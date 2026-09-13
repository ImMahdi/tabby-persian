import test from 'node:test'
import assert from 'node:assert/strict'
import { LocalProfilesService } from './profiles.ts'

test('LocalProfilesService includes Persian & Agent Terminal builtin profile', async () => {
    const mockApp: any = {}
    const mockConfig: any = { store: {} }
    const mockShellProviders: any[] = [{
        id: 'powershell',
        name: 'PowerShell',
        provide: async () => [{ id: 'powershell', name: 'PowerShell', command: 'powershell.exe' }],
    }]
    const service = new LocalProfilesService(mockApp, mockConfig, mockShellProviders)
    const profiles = await service.getBuiltinProfiles()

    const persianProfile = profiles.find(p => p.id === 'local:persian-agent')
    assert.ok(persianProfile, 'Should register local:persian-agent profile')
    assert.strictEqual(persianProfile.name, 'Persian & Agent Terminal')
    assert.strictEqual(persianProfile.type, 'local')
    assert.strictEqual(persianProfile.icon, 'fas fa-robot')
    assert.strictEqual(persianProfile.isBuiltin, true)
    assert.strictEqual(persianProfile.options?.enablePersianBidi, true)
    assert.strictEqual(persianProfile.options?.enableAgentMarkdown, true)
    assert.strictEqual(persianProfile.options?.useYekanFont, true)
})

test('LocalProfilesService preserves standard shell profiles', async () => {
    const mockApp: any = {}
    const mockConfig: any = { store: {} }
    const mockShellProviders: any[] = [{
        id: 'powershell',
        name: 'PowerShell',
        provide: async () => [{ id: 'powershell', name: 'PowerShell', command: 'powershell.exe' }],
    }]
    const service = new LocalProfilesService(mockApp, mockConfig, mockShellProviders)
    const profiles = await service.getBuiltinProfiles()

    const powershellProfile = profiles.find(p => p.id === 'local:powershell')
    assert.ok(powershellProfile, 'Should preserve standard local:powershell profile')
    assert.strictEqual(powershellProfile.name, 'PowerShell')
    assert.strictEqual(powershellProfile.options?.command, 'powershell.exe')
    assert.strictEqual(powershellProfile.options?.enablePersianBidi, false)
    assert.strictEqual(powershellProfile.options?.enableAgentMarkdown, false)
    assert.strictEqual(powershellProfile.options?.useYekanFont, false)
})

test('LocalProfilesService configDefaults sets default Persian & Agent options to false', () => {
    const mockApp: any = {}
    const mockConfig: any = { store: {} }
    const service = new LocalProfilesService(mockApp, mockConfig, [])

    assert.strictEqual(service.configDefaults.options.enablePersianBidi, false)
    assert.strictEqual(service.configDefaults.options.enableAgentMarkdown, false)
    assert.strictEqual(service.configDefaults.options.useYekanFont, false)
})
