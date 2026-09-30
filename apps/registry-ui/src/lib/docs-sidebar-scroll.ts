/** The `sessionStorage` key holding the docs sidebar's last scroll offset and the page it was read on. */
export const DOCS_SIDEBAR_SCROLL_STORAGE_KEY = 'docs-sidebar-scroll';

/**
 * Restores the docs sidebar's scroll offset before first paint, so a reload does not show the list at
 * its top and then jump. Inlined in the root layout's `<head>`; it watches the document until the
 * sidebar's list is parsed, then does what `DocsSidebar`'s layout effect does after hydration: the
 * stored offset when it was stored on this page, otherwise the current item centred in the list.
 * Base UI marks the current item with a bare `data-active` attribute, where Radix writes `"true"`.
 */
export const DOCS_SIDEBAR_SCROLL_RESTORE_SCRIPT = `(function () {
  if (location.pathname !== "/docs" && !location.pathname.startsWith("/docs/")) return

  var stored = null
  try {
    stored = JSON.parse(sessionStorage.getItem("${DOCS_SIDEBAR_SCROLL_STORAGE_KEY}"))
  } catch (e) {}

  function getActiveItem(container) {
    var items = container.querySelectorAll('[data-active]')
    var active = null
    var activePathLength = -1
    var activeDistance = Infinity
    var containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2

    for (var i = 0; i < items.length; i++) {
      var link = items[i].querySelector('a[href]')
      var href = items[i].getAttribute('href') || (link && link.getAttribute('href'))
      var pathLength = href ? href.length : 0
      var itemRect = items[i].getBoundingClientRect()
      var distance = Math.abs(itemRect.top + itemRect.height / 2 - containerCenter)

      if (pathLength > activePathLength || (pathLength === activePathLength && distance < activeDistance)) {
        active = items[i]
        activePathLength = pathLength
        activeDistance = distance
      }
    }

    return active
  }

  function restoreScroll() {
    var container = document.querySelector('[data-docs-sidebar-content]')
    if (!container || !container.clientHeight) return

    if (stored && stored.pathname === location.pathname) {
      container.scrollTop = stored.scrollTop
      return
    }

    var active = getActiveItem(container)
    if (!active) return

    var containerRect = container.getBoundingClientRect()
    var activeRect = active.getBoundingClientRect()
    if (activeRect.top >= containerRect.top && activeRect.bottom <= containerRect.bottom) return

    container.scrollTop += activeRect.top - containerRect.top - (container.clientHeight - activeRect.height) / 2
  }

  var observer = new MutationObserver(restoreScroll)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  restoreScroll()

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      restoreScroll()
      observer.disconnect()
    }, { once: true })
  } else {
    observer.disconnect()
  }
})()`;
