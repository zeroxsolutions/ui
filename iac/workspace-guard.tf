# Which workspace is selected lives in a local file under .terraform/, not in the
# backend, so `rm -rf .terraform` or `init -reconfigure` silently drops the selection
# back to `default`. A plan there is not an error - it reports every resource as
# "to add", because nothing exists under that workspace - and an apply would build a
# second, parallel set of real infrastructure beside the one already running.
#
# Worse here than the generic case: the bucket name carries terraform.workspace but the
# custom domain does not, so a stray apply would also try to re-point the live
# fluent-emoji.zeroxsolutions.com at the empty parallel bucket.
#
# This root is applied in the `production` workspace only. The artwork is byte-identical in
# every environment, so a development bucket would hold a second copy of 370 MB to serve the
# same bytes; local dev reads the production URL.
resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = terraform.workspace == "production"
      error_message = "Workspace is '${terraform.workspace}'. This root is applied in the production workspace only - run `terraform workspace select production` first. Applying from another workspace builds a second, parallel set of infrastructure."
    }
  }
}
