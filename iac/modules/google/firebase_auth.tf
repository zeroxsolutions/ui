# Firebase Auth / Identity Platform - DISABLED by default.
#
# Both source repos (chiselhub + mmovn) ship this disabled pending a linked GCP
# billing account: the Identity Platform / IAP resources require billing on. The
# full resource template lived here before this trim - restore it from git history
# (the commit that reduced this file to a note) to re-enable, then set:
#   var.enable_google_signin = true    # auto-creates the OAuth client via IAP
#   var.support_email        = <email> # required for the OAuth consent screen
#
# The restored block provisions: the identity_toolkit + (conditionally) iap APIs,
# google_identity_platform_config (email/password), and - when enable_google_signin
# - google_iap_brand + google_iap_client +
# google_identity_platform_default_supported_idp_config for google.com, plus the
# google_oauth_client_id / google_oauth_client_secret outputs.
