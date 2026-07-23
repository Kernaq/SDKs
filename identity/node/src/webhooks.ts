import { BaseClient } from './client.js'
import type {
  CreateWebhookRequest,
  WebhookCreatedResponse,
  Webhook,
  WebhookListResponse,
  UpdateWebhookRequest,
  RotateSecretResponse,
  WebhookDeliveryListResponse,
} from './types.js'

export class WebhooksResource extends BaseClient {

  /**
   * Register a webhook endpoint to receive signed event callbacks.
   * The `secret` in the response is shown **only once** — store it securely.
   *
   * @example
   * const wh = await kernaq.webhooks.create({
   *   url:    'https://your-server.com/webhooks/kernaq',
   *   events: ['verification.completed', 'verification.failed'],
   * })
   * console.log(wh.secret) // store this — not shown again
   */
  create(req: CreateWebhookRequest): Promise<WebhookCreatedResponse> {
    return this.request<WebhookCreatedResponse>('POST', '/webhooks', req)
  }

  /** List all registered webhooks. Secrets are never returned. */
  list(): Promise<WebhookListResponse> {
    return this.request<WebhookListResponse>('GET', '/webhooks')
  }

  /** Get a single webhook by ID. */
  get(id: string): Promise<Webhook> {
    return this.request<Webhook>('GET', `/webhooks/${id}`)
  }

  /** Update a webhook's URL, events, or active status. All fields optional. */
  update(id: string, req: UpdateWebhookRequest): Promise<Webhook> {
    return this.request<Webhook>('PATCH', `/webhooks/${id}`, req)
  }

  /** Delete a webhook. */
  delete(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('DELETE', `/webhooks/${id}`)
  }

  /**
   * Rotate the signing secret for a webhook.
   * The new secret is active immediately. Store it before this call returns.
   */
  rotateSecret(id: string): Promise<RotateSecretResponse> {
    return this.request<RotateSecretResponse>('POST', `/webhooks/${id}/rotate-secret`)
  }

  /** List the last 50 delivery attempts for a webhook — useful for debugging. */
  listDeliveries(id: string): Promise<WebhookDeliveryListResponse> {
    return this.request<WebhookDeliveryListResponse>('GET', `/webhooks/${id}/deliveries`)
  }
}
