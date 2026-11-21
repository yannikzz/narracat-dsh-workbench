/**
 * Novel workbench — browser half.
 *
 * Generated file. Edit `src/client/*.js` and run `node dev/build-client.mjs`.
 * The page reads `.narracat` projects through the plugin's same-origin API and
 * edits the book's text files in place.
 */

window.__ModuleLoader__.load({
  id: 'narracat-dsh-workbench',
  factory(require) {
    const React = require('react')
    const e = React.createElement
    const { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } = React

    const NS = 'novelWorkbench'
    const API = '/novel-workbench/api/'
    const NOVEL_PANEL_KIND = 'novel-workbench'
    const NOVEL_PANEL_ID = 'narracat-dsh-workbench/panel'

    /** Primary navigation: overview plus the four content categories. */
    const CATEGORIES = [
      { id: 'overview', labelKey: 'category.overview', icon: 'grid' },
      { id: 'manuscript', labelKey: 'category.manuscript', icon: 'file' },
      { id: 'blueprint', labelKey: 'category.blueprint', icon: 'compass' },
      { id: 'settings', labelKey: 'category.settings', icon: 'users' },
      { id: 'materials', labelKey: 'category.materials', icon: 'archive' },
    ]

    /** Generated cover palettes. A book keeps the same one across visits. */
    const COVER_PALETTES = [
      { bg: '#1b2430', ink: '#efe8da', accent: '#a8442f', pattern: 'rain' },
      { bg: '#e9e1d2', ink: '#1c1b18', accent: '#b5813c', pattern: 'sun' },
      { bg: '#394843', ink: '#eee8dc', accent: '#b56a4a', pattern: 'arc' },
      { bg: '#2c2433', ink: '#efe4ea', accent: '#9b4f6b', pattern: 'arc' },
      { bg: '#efe9df', ink: '#26231f', accent: '#7c6a4f', pattern: 'rain' },
      { bg: '#24313a', ink: '#e6edf0', accent: '#4f7c8a', pattern: 'sun' },
    ]

    /** Fine grain, inlined; no external asset. */
    const NOISE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")"
