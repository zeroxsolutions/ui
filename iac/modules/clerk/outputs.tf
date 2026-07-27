output "applications" {
  description = "Per logical_key: application id + name + full instances (publishable_key + secret_key per environment)."
  value = {
    for app_key, app in clerk_application.this : app_key => {
      id        = app.id
      name      = app.name
      instances = app.instances
    }
  }
  sensitive = true # instances[].secret_key
}

output "publishable_keys" {
  description = "Per logical_key -> { environment_type => publishable_key }. Non-secret (client-facing)."
  value = {
    for app_key, app in clerk_application.this : app_key => {
      for inst in app.instances : inst.environment_type => inst.publishable_key
    }
  }
}

output "domains" {
  description = "Provisioned custom domains with their DNS CNAME targets + frontend API URL."
  value = [
    for d in clerk_domain.this : {
      name             = d.name
      frontend_api_url = d.frontend_api_url
      cname_targets    = d.cname_targets
    }
  ]
}

output "organizations" {
  description = "Per logical_key => { id, name, slug }."
  value = {
    for k, org in clerk_organization.this : k => { id = org.id, name = org.name, slug = org.slug }
  }
}

output "permissions" {
  description = "Per logical_key => { id, key }."
  value = {
    for k, p in clerk_organization_permission.this : k => { id = p.id, key = p.key }
  }
}

output "roles" {
  description = "Per logical_key => { id, key }."
  value = {
    for k, r in clerk_organization_role.this : k => { id = r.id, key = r.key }
  }
}

output "role_sets" {
  description = "Per logical_key => { id, key }."
  value = {
    for k, rs in clerk_role_set.this : k => { id = rs.id, key = rs.key }
  }
}

output "redirect_urls" {
  description = "Provisioned redirect URLs: url => id."
  value       = { for k, r in clerk_redirect_url.this : k => r.id }
}

output "jwt_templates" {
  description = "Provisioned JWT templates: name => id."
  value       = { for k, t in clerk_jwt_template.this : k => t.id }
}

output "organization_domains" {
  description = "Provisioned organization domains with verification status."
  value = [
    for d in clerk_organization_domain.this : { name = d.name, verification_status = d.verification_status }
  ]
}

output "instance_configs" {
  description = "Provisioned instance configs: application_key => id."
  value       = { for k, c in clerk_instance_config.this : k => c.id }
}
