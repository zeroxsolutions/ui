# Backend API. Singleton instance organization settings.
resource "clerk_application_settings" "this" {
  count = var.application_settings == null ? 0 : 1

  enable_organizations    = var.application_settings.enable_organizations
  admin_delete_enabled    = var.application_settings.admin_delete_enabled
  domains_enabled         = var.application_settings.domains_enabled
  max_allowed_memberships = var.application_settings.max_allowed_memberships
}
