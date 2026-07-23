import { BaseClient } from './client.js'
import type { ProjectSettings, UpdateSettingsRequest } from './types.js'

export class SettingsResource extends BaseClient {

  /**
   * Get the current risk thresholds and security settings for the project.
   *
   * @example
   * const settings = await kernaq.settings.get()
   * console.log(settings.risk_threshold_high)   // 60
   * console.log(settings.require_capture_token) // false
   */
  get(): Promise<ProjectSettings> {
    return this.request<ProjectSettings>('GET', '/settings')
  }

  /**
   * Update project settings. All fields are optional.
   *
   * Common patterns:
   *  - Tighten risk thresholds for a fintech (medium: 15, high: 40)
   *  - Enable capture token enforcement for anti-injection protection
   *  - Enable cross-project dedup for fraud ring detection
   *
   * @example
   * await kernaq.settings.update({
   *   require_capture_token:     true,
   *   enable_cross_project_dedup: true,
   *   risk_threshold_medium:     15,
   *   risk_threshold_high:       40,
   * })
   */
  update(req: UpdateSettingsRequest): Promise<ProjectSettings> {
    return this.request<ProjectSettings>('PUT', '/settings', req)
  }
}
