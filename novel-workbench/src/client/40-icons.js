    /** Inline line icons. 24 viewBox, 1.7 stroke, currentColor. */
    const ICONS = {
      book: [['path', { d: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15.5H6.5A2.5 2.5 0 0 0 4 21z' }], ['path', { d: 'M4 18.5A2.5 2.5 0 0 1 6.5 16H19' }], ['path', { d: 'M8 7h7' }], ['path', { d: 'M8 10.5h5' }]],
      home: [['path', { d: 'M4 10.5 12 4l8 6.5' }], ['path', { d: 'M6.5 9v10.5h11V9' }], ['path', { d: 'M10.5 19.5v-5h3v5' }]],
      panelLeft: [['rect', { x: 3, y: 4, width: 18, height: 16, rx: 2.5 }], ['path', { d: 'M9 4v16' }]],
      panelRight: [['rect', { x: 3, y: 4, width: 18, height: 16, rx: 2.5 }], ['path', { d: 'M15 4v16' }]],
      plus: [['path', { d: 'M12 5v14M5 12h14' }]],
      more: [['circle', { cx: 5.5, cy: 12, r: 1 }], ['circle', { cx: 12, cy: 12, r: 1 }], ['circle', { cx: 18.5, cy: 12, r: 1 }]],
      search: [['circle', { cx: 10.5, cy: 10.5, r: 6 }], ['path', { d: 'm15 15 4 4' }]],
      refresh: [['path', { d: 'M20 11a8 8 0 1 0-2.3 6' }], ['path', { d: 'M20 5v6h-6' }]],
      edit: [['path', { d: 'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z' }], ['path', { d: 'm14.5 6.5 3 3' }]],
      chevronDown: [['path', { d: 'm6 9 6 6 6-6' }]],
      chevronRight: [['path', { d: 'm9 6 6 6-6 6' }]],
      chevronLeft: [['path', { d: 'm15 6-6 6 6 6' }]],
      arrowRight: [['path', { d: 'M4 12h15' }], ['path', { d: 'm13 6 6 6-6 6' }]],
      grid: [['rect', { x: 3.5, y: 3.5, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 13.5, y: 3.5, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 3.5, y: 13.5, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 13.5, y: 13.5, width: 7, height: 7, rx: 1.5 }]],
      file: [['path', { d: 'M6 3h7l5 5v13H6z' }], ['path', { d: 'M13 3v5h5' }], ['path', { d: 'M9 13h6M9 17h4' }]],
      compass: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'm15.5 8.5-2 5-5 2 2-5z' }]],
      users: [['circle', { cx: 9, cy: 8, r: 3 }], ['path', { d: 'M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5' }], ['path', { d: 'M16 5.5a3 3 0 0 1 0 5.5' }], ['path', { d: 'M17.5 15.5c2 .7 3 2.4 3 4.5' }]],
      archive: [['rect', { x: 3.5, y: 4.5, width: 17, height: 5, rx: 1.5 }], ['path', { d: 'M5 9.5v9a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-9' }], ['path', { d: 'M10 13h4' }]],
      close: [['path', { d: 'm6 6 12 12M18 6 6 18' }]],
      check: [['path', { d: 'm5 12.5 4.5 4.5L19 7' }]],
      alert: [['path', { d: 'M12 4 3.5 20h17z' }], ['path', { d: 'M12 9.5v4.5' }], ['path', { d: 'M12 17.5v.01' }]],
      spark: [['path', { d: 'M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9z' }]],
      save: [['path', { d: 'M5 4h11l3 3v13H5z' }], ['path', { d: 'M8 4v5h7V4' }], ['path', { d: 'M8 14h8v6H8z' }]],
      clock: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'M12 7.5V12l3 2' }]],
      external: [['path', { d: 'M14 4h6v6' }], ['path', { d: 'M20 4 11 13' }], ['path', { d: 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5' }]],
    }

    /**
     * One inline icon.
     * @param {string} name - glyph name.
     * @param {number} [size] - pixel size.
     * @returns {any} the svg element.
     */
    function icon(name, size = 16) {
      const parts = ICONS[name] ?? []
      return e('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      }, parts.map(([tag, attrs], index) => e(tag, { ...attrs, key: index })))
    }

    /**
     * An icon-only button.
     *
     * The visible name lives in a CSS tooltip (`data-tip`, drawn by
     * `[data-tip]::after`), so it appears instantly on hover and on keyboard
     * focus. Native `title` is deliberately not set: it would wait a second and
     * then draw a second, uglier tooltip on top of this one. `aria-label` keeps
     * the button named for screen readers and tests.
     *
     * @param {object} props - glyph, label, onClick and optional tooltip alignment.
     * @returns {any} the button.
     */
    function IconButton(props) {
      const {
        glyph, label, onClick, disabled, className = '', size = 16,
        ariaExpanded, ariaPressed, tipAlign, tipPlace, plain, autoFocus,
      } = props
      return e('button', {
        type: 'button',
        className: `${plain ? '' : 'nw-iconbtn'} ${className}`.trim(),
        'aria-label': label,
        'aria-expanded': ariaExpanded,
        'aria-pressed': ariaPressed,
        disabled,
        autoFocus,
        onClick,
        'data-tip': label,
        'data-tip-align': tipAlign,
        'data-tip-place': tipPlace,
      }, icon(glyph, size))
    }
