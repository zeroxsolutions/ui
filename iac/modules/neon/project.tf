resource "neon_project" "main" {
  org_id                    = var.org_id
  name                      = "${var.project_name}-${terraform.workspace}"
  region_id                 = var.region_id
  pg_version                = var.pg_version
  history_retention_seconds = var.history_retention_seconds

  branch {
    name = "main"
  }
}

output "database_host" {
  value = neon_project.main.database_host
}
