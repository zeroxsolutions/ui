# Neon connection details. database_host is non-secret; database_roles holds the
# per-database owner passwords (sensitive) - consumed by the root to build the
# direct migration URLs (BYPASS Hyperdrive; see db-migrations).

output "database_host" {
  value = neon_project.main.database_host
}

# Passwords become readable only after the role-provisioning wait (role.tf).
output "database_roles" {
  depends_on = [time_sleep.wait_30_seconds]
  sensitive  = true
  value = {
    for key, database_name in var.databases : key => {
      name     = "${key}_owner"
      password = neon_role.main[key].password
    }
  }
}
