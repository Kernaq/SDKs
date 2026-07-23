package kernaq

import "context"

// WebhooksResource handles /v1/webhooks.
type WebhooksResource struct {
	c *client
}

// Create registers a webhook endpoint to receive signed event callbacks.
// The Secret in the response is shown only once — store it securely.
func (r *WebhooksResource) Create(ctx context.Context, req CreateWebhookRequest) (*WebhookCreatedResponse, error) {
	var out WebhookCreatedResponse
	if err := r.c.postJSON(ctx, "/webhooks", req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// List returns all registered webhooks for the project. Secrets are never returned.
func (r *WebhooksResource) List(ctx context.Context) (*WebhookListResponse, error) {
	var out WebhookListResponse
	if err := r.c.get(ctx, "/webhooks", &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get returns a single webhook by ID.
func (r *WebhooksResource) Get(ctx context.Context, id string) (*Webhook, error) {
	var out Webhook
	if err := r.c.get(ctx, "/webhooks/"+id, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Update updates a webhook's URL, events, or active status.
func (r *WebhooksResource) Update(ctx context.Context, id string, req UpdateWebhookRequest) (*Webhook, error) {
	var out Webhook
	if err := r.c.patchJSON(ctx, "/webhooks/"+id, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Delete removes a webhook.
func (r *WebhooksResource) Delete(ctx context.Context, id string) error {
	return r.c.do(ctx, "DELETE", "/webhooks/"+id, nil, "", nil, nil)
}

// RotateSecret generates a new signing secret for a webhook.
// The new secret is returned once and active immediately.
func (r *WebhooksResource) RotateSecret(ctx context.Context, id string) (*RotateSecretResponse, error) {
	var out RotateSecretResponse
	if err := r.c.do(ctx, "POST", "/webhooks/"+id+"/rotate-secret", nil, "", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ListDeliveries returns the last 50 delivery attempts for a webhook.
func (r *WebhooksResource) ListDeliveries(ctx context.Context, id string) (*WebhookDeliveryListResponse, error) {
	var out WebhookDeliveryListResponse
	if err := r.c.get(ctx, "/webhooks/"+id+"/deliveries", &out); err != nil {
		return nil, err
	}
	return &out, nil
}
