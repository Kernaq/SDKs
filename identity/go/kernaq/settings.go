package kernaq

import "context"

// SettingsResource handles /v1/settings.
type SettingsResource struct {
	c *client
}

// Get returns the current risk thresholds and security settings for the project.
func (r *SettingsResource) Get(ctx context.Context) (*ProjectSettings, error) {
	var out ProjectSettings
	if err := r.c.get(ctx, "/settings", &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Update modifies project settings. All fields in req are optional (pointer types).
func (r *SettingsResource) Update(ctx context.Context, req UpdateSettingsRequest) (*ProjectSettings, error) {
	var out ProjectSettings
	if err := r.c.putJSON(ctx, "/settings", req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
