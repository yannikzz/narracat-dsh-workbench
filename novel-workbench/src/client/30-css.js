    const CSS = `
/* Horizontal inset scale: app bar 16 · directory head 16 · list rows 12 (children 36) · content toolbar 20/16 · panel 18/12 · overview 40 · buttons 14/12. */
.nw-root{
  --nw-font:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif;
  --nw-serif:"Songti SC","STSong","SimSun","Noto Serif CJK SC","Source Han Serif SC",serif;
  --nw-mono:ui-monospace,"SF Mono","Cascadia Mono",Menlo,monospace;
  --nw-canvas:color-mix(in oklab,var(--dsw-alias-bg-base) 96%,var(--dsw-alias-label-primary));
  --nw-surface:var(--dsw-alias-bg-layer-1);
  --nw-aside:color-mix(in oklab,var(--nw-canvas) 55%,var(--nw-surface));
  --nw-paper:#f5f3ef;
  --nw-border:var(--dsw-alias-border-l1);
  --nw-border-strong:var(--dsw-alias-border-l2);
  --nw-text-1:var(--dsw-alias-label-primary);
  --nw-text-2:var(--dsw-alias-label-secondary);
  --nw-text-3:color-mix(in oklab,var(--dsw-alias-label-secondary) 85%,var(--dsw-alias-bg-base));
  --nw-hover:color-mix(in oklab,var(--dsw-alias-label-primary) 4%,transparent);
  --nw-active:color-mix(in oklab,var(--dsw-alias-label-primary) 7%,transparent);
  --nw-primary:var(--dsw-alias-label-primary);
  --nw-primary-fg:var(--dsw-alias-bg-base);
  --nw-success:color-mix(in oklab,var(--dsw-alias-state-success-primary) 55%,var(--dsw-alias-label-primary));
  --nw-warn:color-mix(in oklab,var(--dsw-alias-state-warn-primary) 55%,var(--dsw-alias-label-primary));
  --nw-danger:var(--dsw-alias-state-error-primary);
  --nw-tint-alpha:13%;
  --nw-shadow-card:0 8px 24px rgb(0 0 0 / 7%);
  --nw-shadow-float:0 18px 48px rgb(0 0 0 / 10%);
  --nw-shadow-cover:0 36px 64px -26px rgba(24,23,20,.42),0 10px 22px -12px rgba(24,23,20,.24);
  --nw-shadow-cover-side:0 22px 44px -24px rgba(24,23,20,.35);
  height:100%;min-height:0;background:var(--nw-canvas);color:var(--nw-text-1);font-family:var(--nw-font);font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased;overflow:hidden;
}
body[data-ds-dark-theme] .nw-root{
  --nw-paper:#141311;
  --nw-text-3:color-mix(in oklab,var(--dsw-alias-label-secondary) 70%,var(--dsw-alias-bg-base));
  --nw-hover:rgba(255,255,255,.06);
  --nw-active:rgba(255,255,255,.10);
  --nw-primary-fg:#171614;
  --nw-success:var(--dsw-alias-state-success-primary);
  --nw-warn:var(--dsw-alias-state-warn-primary);
  --nw-danger:var(--dsw-alias-state-error-primary);
  --nw-tint-alpha:22%;
  --nw-shadow-card:0 8px 24px rgb(0 0 0 / 32%);
  --nw-shadow-float:0 18px 48px rgb(0 0 0 / 40%);
  --nw-shadow-cover:0 36px 64px -22px rgba(0,0,0,.78),0 10px 22px -10px rgba(0,0,0,.5);
  --nw-shadow-cover-side:0 22px 44px -22px rgba(0,0,0,.7);
}
.nw-root *{box-sizing:border-box}
.nw-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.nw-root svg{display:block;flex:0 0 auto}
.nw-root .nw-spacer{flex:1 1 auto;min-width:0}
.nw-root :focus-visible{outline:2px solid color-mix(in oklab,var(--nw-text-2) 80%,transparent);outline-offset:2px}
.nw-root ::selection{background:color-mix(in oklab,var(--dsw-alias-brand-primary,#4176e6) 40%,transparent)}
.nw-root ::-webkit-scrollbar{width:10px;height:10px}
.nw-root ::-webkit-scrollbar-track{background:transparent}
.nw-root ::-webkit-scrollbar-thumb{background:var(--nw-border);border:3px solid transparent;background-clip:content-box;border-radius:999px}
.nw-root ::-webkit-scrollbar-thumb:hover{background:var(--nw-border-strong);background-clip:content-box}

/* shared controls */
.nw-btn{height:32px;padding:0 14px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-weight:500;line-height:1;white-space:nowrap;flex:0 0 auto;transition:background .15s,color .15s,opacity .15s}
.nw-btn.is-sm{height:28px;padding:0 12px;font-size:12px}
.nw-btn.is-primary{background:var(--nw-primary);color:var(--nw-primary-fg)}
.nw-btn.is-primary:hover{opacity:.9}
.nw-btn.is-secondary{background:var(--nw-hover);color:var(--nw-text-1)}
.nw-btn.is-secondary:hover{background:var(--nw-active)}
.nw-btn.is-ghost{color:var(--nw-text-2)}
.nw-btn.is-ghost:hover{background:var(--nw-hover);color:var(--nw-text-1)}
.nw-btn:disabled{opacity:.42;cursor:default}
.nw-iconbtn{position:relative;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:var(--nw-text-2);flex:0 0 auto;transition:background .15s,color .15s}
.nw-iconbtn:hover{background:var(--nw-hover);color:var(--nw-text-1)}
.nw-iconbtn:disabled{opacity:.35;cursor:default}
/* Icon-only controls explain themselves on hover and keyboard focus. The
   bubble is CSS-only so it needs no render pass and cannot steal the pointer;
   the brief visibility delay avoids flashing labels while the cursor crosses
   a toolbar. Native title is intentionally absent (it would double up). */
.nw-iconbtn[data-tip]::after,
.nw-contact-close[data-tip]::after{content:attr(data-tip);position:absolute;z-index:140;left:50%;top:calc(100% + 7px);transform:translateX(-50%) translateY(-2px);max-width:240px;padding:5px 9px;border-radius:7px;background:color-mix(in oklab,var(--nw-text-1) 94%,transparent);color:var(--nw-primary-fg);font-family:var(--nw-font);font-size:11px;font-weight:500;line-height:1.4;letter-spacing:.01em;white-space:nowrap;box-shadow:0 8px 20px rgb(0 0 0 / 16%);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease,transform .12s ease,visibility 0s .16s}
.nw-iconbtn[data-tip]::before,
.nw-contact-close[data-tip]::before{content:"";position:absolute;z-index:141;left:50%;top:calc(100% + 1px);margin-left:-4px;border:4px solid transparent;border-bottom-color:color-mix(in oklab,var(--nw-text-1) 94%,transparent);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease,visibility 0s .16s}
.nw-iconbtn[data-tip]:hover::after,
.nw-iconbtn[data-tip]:focus-visible::after,
.nw-contact-close[data-tip]:hover::after,
.nw-contact-close[data-tip]:focus-visible::after{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);transition:opacity .12s ease .28s,transform .12s ease .28s,visibility 0s .28s}
.nw-iconbtn[data-tip]:hover::before,
.nw-iconbtn[data-tip]:focus-visible::before,
.nw-contact-close[data-tip]:hover::before,
.nw-contact-close[data-tip]:focus-visible::before{opacity:1;visibility:visible;transition:opacity .12s ease .28s,visibility 0s .28s}
.nw-iconbtn[data-tip-align="start"]::after{left:0;transform:translateY(-2px)}
.nw-iconbtn[data-tip-align="start"]:hover::after,
.nw-iconbtn[data-tip-align="start"]:focus-visible::after{transform:none}
.nw-iconbtn[data-tip-align="start"]::before{left:14px;margin-left:0}
.nw-iconbtn[data-tip-align="end"]::after{left:auto;right:0;transform:translateY(-2px)}
.nw-iconbtn[data-tip-align="end"]:hover::after,
.nw-iconbtn[data-tip-align="end"]:focus-visible::after{transform:none}
.nw-iconbtn[data-tip-align="end"]::before{left:auto;right:14px;margin-left:0}
.nw-contact-close[data-tip-align="end"]::after{left:auto;right:0;transform:translateY(-2px)}
.nw-contact-close[data-tip-align="end"]:hover::after,
.nw-contact-close[data-tip-align="end"]:focus-visible::after{transform:none}
.nw-contact-close[data-tip-align="end"]::before{left:auto;right:15px;margin-left:0}
.nw-iconbtn[data-tip-place="top"]::after{top:auto;bottom:calc(100% + 7px);transform:translateX(-50%) translateY(2px)}
.nw-iconbtn[data-tip-place="top"]:hover::after,
.nw-iconbtn[data-tip-place="top"]:focus-visible::after{transform:translateX(-50%)}
.nw-iconbtn[data-tip-place="top"]::before{top:auto;bottom:calc(100% + 1px);border-bottom-color:transparent;border-top-color:color-mix(in oklab,var(--nw-text-1) 94%,transparent)}
.nw-tag{height:20px;padding:0 8px;border-radius:999px;display:inline-flex;align-items:center;font-size:11px;font-weight:500;line-height:1;background:var(--nw-hover);color:var(--nw-text-2);white-space:nowrap}
.nw-tag.is-success{background:color-mix(in oklab,var(--nw-success) 12%,transparent);color:var(--nw-success)}
.nw-tag.is-warn{background:color-mix(in oklab,var(--nw-warn) 14%,transparent);color:var(--nw-warn)}
.nw-tag.is-plain{background:transparent;border:1px solid var(--nw-border);color:var(--nw-text-3);font-weight:400}
.nw-muted{color:var(--nw-text-3);font-size:12px;line-height:1.7}
.nw-kv{display:flex;gap:10px;font-size:12px;line-height:1.75;padding:1px 0}
.nw-kv dt{width:58px;flex:0 0 58px;margin:0;color:var(--nw-text-3)}
.nw-panel .nw-kv dt{width:88px;flex:0 0 88px}
.nw-kv dd{flex:1 1 auto;min-width:0;margin:0;overflow-wrap:anywhere}

/* shelf poster */
.nw-shelf{--shelf-info-h:400px;position:relative;display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;background:var(--nw-paper);color:var(--nw-text-1);container-type:inline-size}
.nw-shelf::after{content:"";position:absolute;inset:0;background-image:${NOISE};opacity:.035;pointer-events:none;mix-blend-mode:multiply;z-index:20}
body[data-ds-dark-theme] .nw-shelf::after{mix-blend-mode:screen;opacity:.04}
.nw-root.is-mac-titlebar .nw-topbar{padding-left:160px}
.nw-topbar{height:52px;flex:0 0 52px;display:flex;align-items:center;gap:10px;padding:0 56px 0 64px;position:relative;z-index:10;transition:padding-left .18s ease}
.nw-shelf .nw-brand{display:flex;align-items:center;gap:10px;font-size:12px;letter-spacing:.08em}
.nw-shelf .nw-logo{width:27px;height:27px;object-fit:contain;display:block;flex:0 0 auto}
.nw-panel-logo{display:block;object-fit:contain}
body[data-ds-dark-theme] .nw-panel-logo{filter:invert(1) brightness(.92)}
body[data-ds-dark-theme] .nw-shelf .nw-logo{filter:invert(1) brightness(.92)}
.nw-shelf .nw-brand-name{white-space:nowrap}
.nw-shelf .nw-brand-dot{width:5px;height:5px;border-radius:50%;background:var(--nw-accent,var(--nw-text-1));margin-left:-2px}
.nw-shelf .nw-stage{flex:1 1 auto;width:100%;max-width:1500px;margin:0 auto;min-height:0;display:grid;grid-template-columns:minmax(460px,620px) minmax(0,1fr);grid-template-rows:var(--shelf-info-h) minmax(0,1fr);grid-template-areas:"copy gallery" "index gallery";padding:44px 56px 42px 64px;position:relative;z-index:2}
.nw-shelf .nw-copy{grid-area:copy;display:flex;flex-direction:column;min-width:0;height:var(--shelf-info-h);overflow:hidden;padding-right:24px;position:relative;z-index:3}
.nw-shelf .nw-eyebrow{font-size:9px;letter-spacing:.26em;color:var(--nw-text-3);display:flex;align-items:center;gap:10px}
.nw-shelf .nw-eyebrow::after{content:"";width:34px;height:1px;background:var(--nw-border);display:block}
.nw-shelf .nw-book-title{font-family:var(--nw-serif);font-weight:600;font-size:clamp(46px,4.9vw,72px);line-height:1.06;letter-spacing:.015em;margin:18px 0 0;max-width:100%;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:1.08em;max-height:2.16em}
.nw-shelf .nw-synopsis{margin:20px 0 0;max-width:27em;font-size:14.5px;line-height:1.95;color:var(--nw-text-2);letter-spacing:.01em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;height:3.9em}
.nw-shelf .nw-meta{margin-top:18px;display:flex;align-items:center;gap:9px;font-size:11px;letter-spacing:.08em;color:var(--nw-text-3);font-variant-numeric:tabular-nums;flex-wrap:nowrap;height:18px;overflow:hidden;white-space:nowrap}
.nw-shelf .nw-meta-dot{width:2px;height:2px;border-radius:50%;background:var(--nw-text-3);display:block}
.nw-shelf .nw-actions{margin-top:24px;padding-top:0;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.nw-shelf .nw-cta{height:38px;padding:0 18px;border-radius:999px;background:var(--nw-primary);color:var(--nw-primary-fg);display:inline-flex;align-items:center;gap:9px;font-size:12.5px;font-weight:500;letter-spacing:.03em;transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s}
.nw-shelf .nw-cta-arrow{transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.nw-shelf .nw-cta:hover{transform:translateY(-1px);box-shadow:0 8px 18px -8px rgba(0,0,0,.4)}
.nw-shelf .nw-cta:hover .nw-cta-arrow{transform:translateX(3px)}
.nw-shelf .nw-newbook{height:38px;padding:0 16px;border-radius:999px;border:1px solid var(--nw-border-strong);display:inline-flex;align-items:center;gap:7px;font-size:12px;letter-spacing:.03em;color:var(--nw-text-2);background:transparent;transition:color .2s,border-color .2s,background .2s}
.nw-shelf .nw-newbook:hover{color:var(--nw-text-1);border-color:var(--nw-text-2);background:color-mix(in oklab,var(--nw-text-1) 4%,transparent)}
.nw-shelf .nw-link{font-size:11.5px;letter-spacing:.05em;color:var(--nw-text-2);display:inline-flex;align-items:center;gap:6px;border-bottom:1px solid transparent;padding-bottom:1px;transition:color .2s,border-color .2s}
.nw-shelf .nw-link:hover{color:var(--nw-text-1);border-color:var(--nw-text-3)}
.nw-shelf .nw-index{grid-area:index;display:flex;flex-direction:column;min-height:0;overflow:hidden;padding:18px 24px 0 0}
.nw-shelf .nw-index-head{display:flex;justify-content:space-between;align-items:baseline;flex:0 0 auto;padding-bottom:9px;border-bottom:1px solid var(--nw-border);font-size:9px;letter-spacing:.22em;color:var(--nw-text-3)}
.nw-shelf .nw-index-list{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-right:6px}
.nw-shelf .nw-index-list::-webkit-scrollbar{width:8px}
.nw-shelf .nw-index-list::-webkit-scrollbar-thumb{background:var(--nw-border);border:2px solid transparent;background-clip:content-box;border-radius:999px}
.nw-shelf .nw-irow{width:100%;display:grid;grid-template-columns:34px minmax(0,1fr) auto 18px;align-items:center;gap:10px;height:46px;border-bottom:1px solid var(--nw-border);text-align:left;color:var(--nw-text-2);position:relative;transition:color .2s}
.nw-shelf .nw-irow-num{font-family:var(--nw-serif);font-size:11px;letter-spacing:.1em;color:var(--nw-text-3);transition:color .2s}
.nw-shelf .nw-irow-title{font-size:13.5px;letter-spacing:.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:font-weight .2s,color .2s}
.nw-shelf .nw-irow-meta{font-size:10px;letter-spacing:.08em;color:var(--nw-text-3);font-variant-numeric:tabular-nums}
.nw-shelf .nw-irow-arrow{opacity:0;transform:translateX(-4px);transition:opacity .2s,transform .2s;color:var(--nw-text-3)}
.nw-shelf .nw-irow:hover{color:var(--nw-text-1)}
.nw-shelf .nw-irow:hover .nw-irow-arrow{opacity:1;transform:none}
.nw-shelf .nw-irow.is-active{color:var(--nw-text-1)}
.nw-shelf .nw-irow.is-active .nw-irow-title{font-weight:600}
.nw-shelf .nw-irow.is-active .nw-irow-num{color:var(--nw-accent)}
.nw-shelf .nw-irow.is-active .nw-irow-arrow{opacity:.55;transform:none}
.nw-shelf .nw-irow.is-active::before{content:"";position:absolute;left:-14px;top:50%;width:4px;height:4px;border-radius:50%;background:var(--nw-accent);transform:translateY(-50%)}
.nw-shelf .nw-gallery{grid-area:gallery;position:relative;min-width:0;z-index:2}
.nw-shelf .nw-glow{position:absolute;left:50%;top:50%;width:740px;height:740px;margin:-370px 0 0 -370px;border-radius:50%;background:radial-gradient(circle,color-mix(in oklab,var(--nw-accent) var(--nw-tint-alpha),transparent) 0%,transparent 66%);filter:blur(6px);transition:background .6s}
.nw-shelf .nw-big-number{position:absolute;right:-26px;top:-56px;font-family:var(--nw-serif);font-weight:500;font-size:286px;line-height:.8;letter-spacing:-.03em;color:var(--nw-text-1);opacity:.045;user-select:none;pointer-events:none}
.nw-shelf .nw-hairline{position:absolute;left:0;right:0;top:0;height:1px;background:var(--nw-border)}
.nw-shelf .nw-fan{position:absolute;left:50%;top:0;bottom:0;width:min(100%,560px);transform:translateX(-50%)}
.nw-shelf .nw-card{position:absolute;transform-origin:50% 60%;transition:transform .65s cubic-bezier(.16,1,.3,1),box-shadow .45s,filter .45s,opacity .45s}
.nw-shelf .nw-card .nw-cover{box-shadow:none}
.nw-shelf .nw-card.is-side{width:190px;height:285px;top:50%;margin-top:-124px;z-index:1;filter:saturate(.8) brightness(.92);opacity:.88}
.nw-shelf .nw-card.is-side .nw-cover{box-shadow:none}
.nw-shelf .nw-card.is-hero .nw-cover{box-shadow:0 0 0 1px rgba(255,255,255,.05)}
body[data-ds-dark-theme] .nw-shelf .nw-card.is-hero .nw-cover{box-shadow:0 0 0 1px rgba(255,255,255,.07)}
.nw-shelf .nw-card.is-left{left:0;transform:rotate(-7deg)}
.nw-shelf .nw-card.is-right{right:0;transform:rotate(7deg)}
.nw-shelf .nw-card.is-side:hover{filter:none;opacity:1;z-index:4;transform:rotate(-3deg) translateY(-14px) scale(1.04)}
.nw-shelf .nw-card.is-side.is-right:hover{transform:rotate(3deg) translateY(-14px) scale(1.04)}
.nw-shelf .nw-card.is-hero{left:50%;top:47%;width:330px;height:495px;margin:-247px 0 0 -165px;z-index:3;transform:translateY(var(--lift,0px)) rotate(calc(-1.6deg + var(--tilt,0deg)))}
.nw-shelf .nw-card.is-hero:hover{--lift:-7px}
.nw-shelf .nw-card.is-hero .nw-cover{animation:nw-cover-in .55s cubic-bezier(.16,1,.3,1) .02s both}
.nw-shelf .nw-card.is-left .nw-cover{animation:nw-cover-in .55s cubic-bezier(.16,1,.3,1) .06s both}
.nw-shelf .nw-card.is-right .nw-cover{animation:nw-cover-in .55s cubic-bezier(.16,1,.3,1) .12s both}
.nw-shelf .nw-book-title{animation:nw-rise .5s cubic-bezier(.16,1,.3,1) both}
.nw-shelf .nw-synopsis{animation:nw-rise .55s cubic-bezier(.16,1,.3,1) .04s both}
.nw-shelf .nw-big-number{animation:nw-number-in .6s cubic-bezier(.16,1,.3,1) both}
.nw-shelf .nw-card-caption{position:absolute;left:0;right:0;bottom:-26px;text-align:center;font-size:9px;letter-spacing:.16em;color:var(--nw-text-3);opacity:0;transition:opacity .25s}
.nw-shelf .nw-card.is-side:hover .nw-card-caption{opacity:1}
.nw-shelf .nw-open-veil{position:absolute;left:0;right:0;bottom:0;height:74px;border-radius:0 0 3px 3px;background:linear-gradient(transparent,rgba(0,0,0,.52));display:flex;align-items:flex-end;justify-content:space-between;padding:0 14px 12px;color:#f7f2e8;font-size:9.5px;letter-spacing:.14em;opacity:0;transition:opacity .25s}
.nw-shelf .nw-card.is-hero:hover .nw-open-veil{opacity:1}
.nw-shelf .nw-gallery-hint{position:absolute;right:0;bottom:-8px;font-size:9px;letter-spacing:.16em;color:var(--nw-text-3)}
.nw-shelf .nw-footer{position:absolute;left:64px;right:56px;bottom:16px;display:flex;justify-content:space-between;font-size:8.5px;letter-spacing:.22em;color:var(--nw-text-3);z-index:10;pointer-events:none}
.nw-shelf-empty{flex:1;display:flex;align-items:center;padding:44px 64px}
.nw-shelf-empty-inner{max-width:720px}
.nw-shelf-empty-title{font-family:var(--nw-serif);font-size:92px;line-height:1.02;font-weight:600;margin:24px 0 0;letter-spacing:.02em}
.nw-shelf-empty-body{font-family:var(--nw-serif);margin:24px 0 0;max-width:24em;font-size:15px;line-height:1.95;color:var(--nw-text-2)}
.nw-shelf-loading{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;color:var(--nw-text-2);font-size:12px;letter-spacing:.08em}
.nw-spinner{width:14px;height:14px;border-radius:50%;border:1.5px solid var(--nw-border);border-top-color:var(--nw-text-2);animation:nw-spin .8s linear infinite}
@keyframes nw-spin{to{transform:rotate(360deg)}}
@keyframes nw-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes nw-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes nw-cover-in{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
@keyframes nw-number-in{from{opacity:0;transform:scale(.94)}}
@keyframes nw-eq{0%,100%{transform:scaleY(.45)}50%{transform:scaleY(1)}}
@keyframes nw-breathe{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.06);opacity:.35}}
@keyframes nw-nib{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@keyframes nw-writing-dot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}}
@keyframes nw-writing-sweep{0%{transform:translateX(-110%)}100%{transform:translateX(400%)}}
@keyframes nw-writing-pen{0%{top:0;opacity:0}8%{opacity:.55}88%{opacity:.55}100%{top:calc(100% - 9px);opacity:0}}
@keyframes nw-writing-shimmer{0%{background-position:120% 0}100%{background-position:-120% 0}}

/* generated cover */
.nw-cover{position:relative;width:100%;height:100%;overflow:hidden;background:var(--cbg);color:var(--cink);container-type:inline-size;border-radius:3px}
.nw-cover-spine{position:absolute;left:0;top:0;bottom:0;width:5%;background:linear-gradient(90deg,rgba(0,0,0,.3),rgba(0,0,0,.04) 62%,transparent);z-index:6}
.nw-cover-edge{position:absolute;inset:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.09),inset 0 0 24px rgba(0,0,0,.08);z-index:7;pointer-events:none}
.nw-cover-mark{position:absolute;top:4.6%;left:7.2%;font-size:2.25cqw;letter-spacing:.34em;opacity:.5;z-index:5;font-weight:500}
.nw-cover-title{position:absolute;font-family:var(--nw-serif);font-weight:600;z-index:5;letter-spacing:.1em}
.nw-cover-title.is-vertical{top:9%;right:9%;writing-mode:vertical-rl;text-orientation:upright;font-size:8.3cqw;line-height:1.32}
.nw-cover-title.is-horizontal{left:8.5%;bottom:11%;right:8.5%;font-size:9.2cqw;line-height:1.34;letter-spacing:.05em}
.nw-cover-seal{position:absolute;right:8%;bottom:7%;width:7.4cqw;height:7.4cqw;display:grid;place-items:center;background:var(--caccent);color:#f8f1e4;font-family:var(--nw-serif);font-size:4.2cqw;line-height:1;border-radius:.6px;transform:rotate(-2deg);box-shadow:0 1px 3px rgba(0,0,0,.22);z-index:5}
.nw-cover-sheen{position:absolute;inset:0;background:linear-gradient(118deg,transparent 28%,rgba(255,255,255,.1) 47%,transparent 60%);z-index:4;opacity:.7}
.nw-cover-grain{position:absolute;inset:0;background-image:${NOISE};opacity:.34;mix-blend-mode:overlay;z-index:5;pointer-events:none}
.nw-cover-art{position:absolute;inset:0;overflow:hidden;z-index:2}
.nw-rain i{position:absolute;top:-6%;width:.28cqw;background:var(--cink);border-radius:99px;transform:rotate(9deg);opacity:.34}
.nw-sun{position:absolute;border-radius:50%;background:var(--cink);left:-15cqw;top:-13cqw;width:68cqw;height:68cqw;opacity:.94}
.nw-horizon{position:absolute;left:0;right:0;top:58%;height:1px;background:var(--cink);opacity:.22}
.nw-ring{position:absolute;border:1px solid var(--cink);border-radius:50%;right:-20cqw;top:-14cqw;width:64cqw;height:64cqw;opacity:.42}
.nw-ring.is-small{right:auto;top:auto;left:-14cqw;bottom:-18cqw;width:44cqw;height:44cqw;opacity:.24}
.nw-bird{position:absolute;left:14cqw;bottom:30cqw;width:26cqw;height:14cqw;opacity:.7}
.nw-bird path{fill:none;stroke:var(--cink);stroke-width:1.1;stroke-linecap:round}

/* workbench shell */
.nw-workbench{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;background:var(--nw-canvas);container-type:inline-size}
.nw-appbar{height:48px;flex:0 0 48px;display:flex;align-items:center;gap:8px;padding:0 16px;min-width:0;transition:padding-left .18s ease}
.nw-root.is-mac-titlebar .nw-appbar{padding-left:160px}
.nw-session-error{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--nw-danger)}
.nw-appbar-title{font-size:13px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nw-appbar-sub{font-size:11px;color:var(--nw-text-3);white-space:nowrap}
.nw-appbar-right{display:flex;align-items:center;gap:6px;flex:0 0 auto}
.nw-appbar .nw-divider{width:1px;height:16px;background:var(--nw-border);margin:0 4px;flex:0 0 auto}
.nw-pill{height:26px;padding:0 10px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:500;background:var(--nw-hover);color:var(--nw-text-2);white-space:nowrap;transition:background .15s,color .15s}
.nw-pill:not(:disabled):hover{background:var(--nw-active);color:var(--nw-text-1)}
.nw-pill.is-writing{color:var(--nw-text-1)}
.nw-pill.is-waiting{color:var(--nw-warn)}
.nw-pill.is-error{color:var(--nw-danger)}
.nw-pill-dot{width:6px;height:6px;border-radius:50%;background:var(--nw-success);animation:nw-pulse 1.8s ease-in-out infinite}
.nw-pill.is-done .nw-pill-dot{animation:none}
.nw-pill.is-waiting .nw-pill-dot{background:var(--nw-warn)}
.nw-pill.is-error .nw-pill-dot{background:var(--nw-danger);animation:none}
.nw-eq{display:inline-flex;align-items:flex-end;gap:2px;height:10px;width:10px;flex:0 0 10px}
.nw-eq i{width:2px;border-radius:2px;background:currentColor;transform-origin:50% 100%;animation:nw-eq 1s ease-in-out infinite}
.nw-eq i:nth-child(1){height:40%;animation-delay:-.32s}
.nw-eq i:nth-child(2){height:100%;animation-delay:-.16s}
.nw-eq i:nth-child(3){height:65%}
.nw-body{flex:1 1 auto;min-height:0;display:flex;padding:4px 12px 12px 0;position:relative}
.nw-rail{width:64px;flex:0 0 64px;display:flex;flex-direction:column;align-items:center;gap:2px;padding-top:2px;position:relative;z-index:5}
.nw-rail-item{width:52px;height:50px;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--nw-text-2);font-size:11px;line-height:1;transition:background .15s,color .15s}
.nw-rail-item:hover{color:var(--nw-text-1);background:var(--nw-hover)}
.nw-rail-item.is-active{background:var(--nw-active);color:var(--nw-text-1);font-weight:600}
.nw-work{flex:1 1 auto;min-width:0;min-height:0;display:flex;background:var(--nw-surface);border-radius:16px;box-shadow:var(--nw-shadow-card);overflow:hidden}
.nw-directory{width:280px;flex:0 0 280px;min-height:0;display:flex;flex-direction:column;background:var(--nw-aside);border-right:1px solid var(--nw-border)}
.nw-directory:not(.is-open){display:none}
.nw-dir-head{height:56px;flex:0 0 56px;display:flex;align-items:center;gap:8px;padding:0 16px}
.nw-dir-head h2{margin:0;font-size:15px;font-weight:600}
.nw-dir-count{font-size:11px;color:var(--nw-text-3);font-weight:400}
.nw-dir-search{margin:0 16px 10px;height:30px;flex:0 0 30px;border-radius:8px;background:var(--nw-surface);border:1px solid var(--nw-border);display:flex;align-items:center;gap:8px;padding:0 10px;color:var(--nw-text-3);font-size:12px}
.nw-dir-search input{flex:1 1 auto;min-width:0;border:0;outline:0;background:transparent;color:var(--nw-text-1);font:inherit;padding:0}
.nw-dir-list{flex:1 1 auto;min-height:0;overflow:auto;padding:2px 8px 8px}
.nw-group{position:relative;margin-bottom:6px}
.nw-group .nw-row{padding-left:36px;padding-right:12px}
.nw-group::before{content:"";position:absolute;left:28px;top:28px;bottom:6px;width:1px;background:var(--nw-border);pointer-events:none}
.nw-group-head{height:28px;display:flex;align-items:center;gap:6px;padding:0 12px;color:var(--nw-text-2);font-size:11px;font-weight:600;width:100%;text-align:left;position:relative;z-index:1}
.nw-group-head .nw-group-count{margin-left:auto;min-width:22px;text-align:right;color:var(--nw-text-3);font-weight:400}
.nw-row{height:32px;display:flex;align-items:center;gap:8px;padding:0 12px;border-radius:8px;font-size:13px;color:var(--nw-text-1);transition:background .12s;width:100%;text-align:left}
.nw-row:hover{background:var(--nw-hover)}
.nw-row.is-active{background:var(--nw-active);font-weight:600}
.nw-row-no{width:40px;flex:0 0 40px;font-size:11px;color:var(--nw-text-3);font-variant-numeric:tabular-nums}
.nw-row-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nw-row-meta{min-width:44px;text-align:right;font-size:10px;color:var(--nw-text-3);font-variant-numeric:tabular-nums;padding-right:2px}
.nw-dot{width:6px;height:6px;border-radius:50%;flex:0 0 auto}
.nw-dot.is-done{background:var(--nw-success)}
.nw-dot.is-plan{background:var(--nw-warn)}
.nw-dot.is-idle{background:var(--nw-border-strong)}
.nw-dot.is-writing{background:var(--nw-text-1);animation:nw-pulse 1.4s ease-in-out infinite}
.nw-row-meta.is-live{color:var(--nw-text-1);font-weight:500}
.nw-content{flex:1 1 auto;min-width:0;min-height:0;display:flex;flex-direction:column;background:var(--nw-surface)}
.nw-ctoolbar{height:56px;flex:0 0 56px;display:flex;align-items:center;gap:10px;padding:0 16px 0 20px;border-bottom:1px solid var(--nw-border);min-width:0}
.nw-ctoolbar.is-editing{height:48px;flex:0 0 48px}
.nw-ctoolbar-lead{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px}
.nw-crumbs{font-size:11px;color:var(--nw-text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nw-crumbs b{color:var(--nw-text-2);font-weight:400}
.nw-ctitle{font-family:var(--nw-serif);font-size:17px;font-weight:600;line-height:1.25;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nw-ctools{display:flex;align-items:center;gap:6px;margin-left:auto;flex:0 0 auto}
.nw-seg{display:flex;height:28px;padding:2px;border-radius:8px;background:var(--nw-hover);gap:2px;max-width:100%;overflow-x:auto;scrollbar-width:none}
.nw-seg::-webkit-scrollbar{display:none}
.nw-seg button{flex:0 0 auto;padding:0 10px;border-radius:6px;font-size:11px;font-weight:500;color:var(--nw-text-2);white-space:nowrap;transition:color .15s,background .15s}
.nw-seg button:not(.is-active):hover{color:var(--nw-text-1)}
/* The selected tab is a surface change, not a stroke: no black underline. */
.nw-seg button.is-active{background:var(--nw-surface);color:var(--nw-text-1);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.nw-cbody{flex:1 1 auto;min-height:0;overflow:auto;position:relative}
.nw-reading{width:min(38em,100%);max-width:38em;margin:0 auto;padding:40px 0 80px;font-size:16.5px}
.nw-reading-kicker{font-size:11px;color:var(--nw-text-3);margin-bottom:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.nw-reading-title{font-family:var(--nw-serif);margin:0 0 26px;font-size:26px;line-height:1.32;font-weight:600;letter-spacing:.02em}
.nw-reading p{font-family:var(--nw-serif);margin:0 0 1.05em;font-size:inherit;line-height:1.98;letter-spacing:.01em;color:var(--nw-text-1)}
.nw-reading h2{font-family:var(--nw-serif);margin:30px 0 10px;font-size:16px;font-weight:600}
.nw-reading .nw-quote{font-family:var(--nw-serif);color:var(--nw-text-2);font-size:15.5px;line-height:1.95;padding-left:14px;border-left:2px solid var(--nw-border)}
.nw-editor-wrap{width:min(38em,100%);max-width:38em;margin:0 auto;padding:40px 0 80px;font-size:16.5px}
.nw-editor{display:block;width:100%;min-height:60vh;padding:0;border:0;outline:0;background:transparent;color:var(--nw-text-1);font-family:var(--nw-serif);font-size:16.5px;line-height:1.98;letter-spacing:.01em;white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;resize:none}
.nw-editor.is-mono{font-family:var(--nw-mono);font-size:13px;line-height:1.7;white-space:pre;overflow-wrap:normal;overflow-x:auto}
/* Manuscript editing: the page is the surface, so the editor has no frame,
   no focus ring and no inner scrollbar. field-sizing lets the text grow to
   the content so only the page column scrolls. */
.nw-page-edit .nw-reading-edit{padding:44px 0 96px;position:relative}
.nw-page-edit:focus-within .nw-reading-edit::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:color-mix(in oklab,var(--nw-text-2) 70%,transparent);pointer-events:none}
.nw-editor-page{display:block;width:100%;min-height:calc(100vh - 360px);padding:0 0 48px;border:0;outline:0;background:transparent;color:var(--nw-text-1);font-family:var(--nw-serif);font-size:16.5px;line-height:1.98;letter-spacing:.01em;white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;resize:none;field-sizing:content;caret-color:var(--nw-text-1)}
.nw-root .nw-editor-page:focus-visible{outline:0}
.nw-edit-title{display:block;width:100%;margin:0 0 26px;padding:0;border:0;outline:0;background:transparent;color:var(--nw-text-1);font-family:var(--nw-serif);font-size:26px;font-weight:600;line-height:1.32;letter-spacing:.02em;caret-color:var(--nw-text-1)}
.nw-root .nw-edit-title:focus-visible{outline:0}
.nw-edit-title::placeholder{color:var(--nw-text-3);font-weight:400;opacity:1}
.nw-edit-state{display:inline-flex;align-items:center;gap:6px}
.nw-edit-state i{width:5px;height:5px;border-radius:50%;background:var(--nw-warn);display:block}
.nw-edit-state.is-saved{color:var(--nw-text-3)}
.nw-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:100%;padding:40px;text-align:center;color:var(--nw-text-2)}
.nw-empty-title{font-family:var(--nw-serif);margin:0;font-size:20px;line-height:1.35;font-weight:600;color:var(--nw-text-1)}
.nw-empty-body{max-width:440px;margin:0;font-size:13px;line-height:1.8}
.nw-empty-actions{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:8px}
.nw-writing-strip{display:inline-flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;max-width:100%;margin-top:4px;padding:6px 10px 6px 12px;border-radius:999px;background:var(--nw-hover);font-size:12px;color:var(--nw-text-2)}
.nw-writing-strip .nw-eq{color:var(--nw-text-1)}
.nw-writing-strip .nw-btn{padding:0 8px;color:var(--nw-text-1)}

/* AI writing: the chapter page is the wait state, not a greyed-out button. */
.nw-writing{width:min(38em,100%);max-width:38em;margin:0 auto;padding:44px 0 80px;min-height:100%}
.nw-writing-head{display:flex;align-items:flex-start;gap:14px}
.nw-writing-mark{width:40px;height:40px;border-radius:50%;flex:0 0 auto;display:grid;place-items:center;position:relative;background:var(--nw-hover);color:var(--nw-text-1)}
.nw-writing-mark::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid color-mix(in oklab,var(--nw-text-1) 16%,transparent);animation:nw-breathe 2.6s ease-in-out infinite}
.nw-writing-mark svg{animation:nw-nib 3.2s ease-in-out infinite}
.nw-writing-copy{min-width:0;padding-top:1px}
.nw-writing-title{font-family:var(--nw-serif);font-size:22px;line-height:1.45;font-weight:600;letter-spacing:.02em;margin:0;display:flex;align-items:baseline;flex-wrap:wrap;gap:4px}
.nw-writing-dots{display:inline-flex;gap:3px;padding-left:2px;align-self:center}
.nw-writing-dots i{width:4px;height:4px;border-radius:50%;background:var(--nw-text-2);animation:nw-writing-dot 1.3s ease-in-out infinite}
.nw-writing-dots i:nth-child(2){animation-delay:.16s}
.nw-writing-dots i:nth-child(3){animation-delay:.32s}
.nw-writing-sub{margin:7px 0 0;font-size:12.5px;line-height:1.85;color:var(--nw-text-2)}
.nw-writing-bar{margin:24px 0 0;height:3px;border-radius:999px;background:var(--nw-hover);overflow:hidden}
.nw-writing-bar i{display:block;height:100%;width:34%;border-radius:999px;background:var(--nw-text-2);opacity:.65;animation:nw-writing-sweep 2.4s cubic-bezier(.45,0,.55,1) infinite}
.nw-writing-meta{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:10px;font-size:11px;color:var(--nw-text-3);font-variant-numeric:tabular-nums}
.nw-writing-clock{color:var(--nw-text-2)}
.nw-writing-sep{color:var(--nw-border-strong)}
.nw-writing-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:22px}
.nw-writing.is-waiting .nw-writing-mark{color:var(--nw-warn);background:color-mix(in oklab,var(--nw-warn) 11%,transparent)}
.nw-writing.is-waiting .nw-writing-bar i{width:100%;background:var(--nw-warn);opacity:.5;animation:none}
.nw-writing.is-error .nw-writing-mark{color:var(--nw-danger);background:color-mix(in oklab,var(--nw-danger) 10%,transparent)}
.nw-writing.is-error .nw-writing-mark::after{border-color:color-mix(in oklab,var(--nw-danger) 22%,transparent);animation:none}
.nw-skel{margin-top:34px;display:grid;gap:16px;padding-left:22px;position:relative}
.nw-skel::before{content:"";position:absolute;left:6px;top:2px;bottom:2px;width:1px;background:var(--nw-border)}
.nw-skel::after{content:"";position:absolute;left:2px;top:0;width:9px;height:9px;border-radius:50%;background:var(--nw-text-2);opacity:.55;box-shadow:0 0 0 4px var(--nw-hover);animation:nw-writing-pen 5.6s cubic-bezier(.5,0,.4,1) infinite}
.nw-skel p{margin:0;display:grid;gap:9px}
.nw-skel i{display:block;height:11px;border-radius:4px;background:linear-gradient(90deg,color-mix(in oklab,var(--nw-text-1) 6%,transparent) 0%,color-mix(in oklab,var(--nw-text-1) 14%,transparent) 42%,color-mix(in oklab,var(--nw-text-1) 6%,transparent) 100%);background-size:240% 100%;animation:nw-writing-shimmer 2.8s ease-in-out infinite}
/* The same writing scene, compacted for the right sidebar panel. */
.nw-p2-writing{margin:0 0 12px;padding:13px 14px 15px;border-radius:12px;background:linear-gradient(180deg,var(--nw-surface),var(--nw-hover));border:1px solid var(--nw-border)}
.nw-writing.is-compact{width:100%;max-width:none;min-height:0;padding:0}
.nw-writing.is-compact .nw-writing-head{gap:10px}
.nw-writing.is-compact .nw-writing-mark{width:32px;height:32px}
.nw-writing.is-compact .nw-writing-title{font-size:16px;line-height:1.45}
.nw-writing.is-compact .nw-writing-sub{font-size:11px;line-height:1.7;margin-top:5px}
.nw-writing.is-compact .nw-writing-bar{margin-top:14px;height:2px}
.nw-writing.is-compact .nw-skel{margin-top:16px;gap:9px;padding-left:15px}
.nw-writing.is-compact .nw-skel::before{left:4px}
.nw-writing.is-compact .nw-skel::after{left:0;width:7px;height:7px}
.nw-writing.is-compact .nw-skel p{gap:7px}
.nw-writing.is-compact .nw-skel i{height:8px;border-radius:3px}
.nw-panel{width:340px;flex:0 0 340px;margin-left:8px;min-height:0;display:flex;flex-direction:column;background:var(--nw-surface);border-radius:16px;box-shadow:var(--nw-shadow-card);overflow:hidden}
.nw-panel:not(.is-open){display:none}
.nw-panel-head{height:48px;flex:0 0 48px;display:flex;align-items:center;gap:6px;padding:0 12px 0 18px;border-bottom:1px solid var(--nw-border)}
.nw-panel-title{font-size:12px;font-weight:600;color:var(--nw-text-2)}
.nw-panel-tabs{display:flex;gap:2px}
.nw-panel-tab{height:28px;padding:0 10px;border-radius:7px;display:flex;align-items:center;font-size:12px;color:var(--nw-text-2)}
.nw-panel-tab.is-active{background:var(--nw-active);color:var(--nw-text-1);font-weight:600}
.nw-panel-body{flex:1 1 auto;min-height:0;overflow:auto;padding:16px 18px 28px}
.nw-sec{padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid var(--nw-border)}
.nw-sec:last-child{border-bottom:0;margin-bottom:0;padding-bottom:0}
.nw-sec h4{margin:0 0 10px;font-size:11px;font-weight:600;color:var(--nw-text-3);letter-spacing:.02em}
.nw-beats{margin:0;padding:0;list-style:none}
.nw-beats li{position:relative;padding:0 0 0 14px;margin:0 0 10px;font-size:12px;line-height:1.7;color:var(--nw-text-2)}
.nw-beats li::before{content:"";position:absolute;left:0;top:7px;width:5px;height:5px;border-radius:50%;background:var(--nw-border-strong)}
.nw-beats li b{color:var(--nw-text-1);font-weight:600}
.nw-tags{display:flex;flex-wrap:wrap;gap:6px}

/* overview */
.nw-ov{max-width:1100px;margin:0 auto;padding:28px 40px 56px}
.nw-ov-hero{display:grid;grid-template-columns:96px minmax(0,1fr);column-gap:28px;row-gap:14px;align-items:start;padding-bottom:20px;border-bottom:1px solid var(--nw-border)}
.nw-ov-cover{grid-column:1;grid-row:1;width:96px;height:144px;border-radius:3px;overflow:hidden;box-shadow:0 12px 28px -14px rgba(0,0,0,.4)}
.nw-ov-main{grid-column:2;grid-row:1;min-width:0}
.nw-ov-title{font-family:var(--nw-serif);margin:0;font-size:28px;line-height:1.25;font-weight:600;letter-spacing:.02em}
.nw-ov-meta{display:flex;align-items:center;gap:6px;margin-top:10px;flex-wrap:wrap}
.nw-ov-summary{grid-column:1 / -1;min-width:0}
.nw-ov-desc{font-family:var(--nw-serif);margin:0;font-size:15px;line-height:1.9;color:var(--nw-text-2);letter-spacing:.01em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nw-ov-summary.is-open .nw-ov-desc{display:block;overflow:visible;-webkit-line-clamp:unset}
.nw-ov-more{display:inline-flex;align-items:center;gap:2px;margin-top:6px;padding:0 0 1px;border-bottom:1px solid transparent;font-size:11px;letter-spacing:.03em;color:var(--nw-text-3)}
.nw-ov-more:hover{color:var(--nw-text-1);border-color:var(--nw-text-3)}
.nw-ov-actions{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}
.nw-progress{margin-top:18px}
.nw-bar{height:6px;border-radius:999px;background:var(--nw-hover);overflow:hidden}
.nw-bar i{display:block;height:100%;border-radius:999px;background:var(--nw-text-1)}
.nw-progress-labels{display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--nw-text-3)}
.nw-stats3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0}
.nw-bigstat{background:var(--nw-hover);border-radius:10px;padding:14px 16px 12px}
.nw-bigstat b{display:block;font-size:22px;line-height:1;font-weight:600;font-variant-numeric:tabular-nums}
.nw-bigstat b em{font-style:normal;font-size:11px;color:var(--nw-text-3);margin-left:6px}
.nw-bigstat span{display:block;margin-top:8px;font-size:11px;color:var(--nw-text-3)}
.nw-nextstep{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;background:var(--nw-hover);margin:4px 0 24px}
.nw-nextstep-icon{width:34px;height:34px;border-radius:50%;background:var(--nw-surface);display:grid;place-items:center;color:var(--nw-text-2);flex:0 0 auto}
.nw-nextstep-text{flex:1 1 auto;min-width:0}
.nw-nextstep-text b{display:block;font-size:14px}
.nw-nextstep-text p{margin:3px 0 0;font-size:12px;color:var(--nw-text-2)}
.nw-section{margin-top:24px}
.nw-section h2{margin:0 0 12px;font-size:15px;font-weight:600}
.nw-sec-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.nw-sec-head h2{margin:0}
.nw-memtabs{flex:0 0 auto}
.nw-memcount{font-size:10px;color:var(--nw-text-3);margin-left:5px;font-variant-numeric:tabular-nums}
.nw-seg button.is-active .nw-memcount{color:var(--nw-text-2)}
.nw-mem-empty{margin:4px 0 0;padding:8px 0}
.nw-frow-list,.nw-states{display:flex;flex-direction:column}
.nw-frow{display:grid;grid-template-columns:84px minmax(0,1fr) auto;gap:12px;align-items:start;padding:12px;border-bottom:1px solid var(--nw-border)}
.nw-frow:last-child{border-bottom:0}
.nw-frow-id{font-family:var(--nw-mono);font-size:10px;color:var(--nw-text-3);padding-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nw-frow-desc{font-family:var(--nw-serif);font-size:14px;line-height:1.7;margin:0;color:var(--nw-text-1)}
.nw-frow-meta{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:4px;font-size:11px;color:var(--nw-text-3)}
.nw-frow .nw-tag{white-space:nowrap}
.nw-state-row{display:grid;grid-template-columns:96px minmax(0,1fr);gap:16px;align-items:start;padding:12px;border-bottom:1px solid var(--nw-border)}
.nw-state-row:last-child{border-bottom:0}
.nw-state-name{font-size:13px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nw-state-dims{display:flex;flex-wrap:wrap;gap:6px}
.nw-state-chip{display:inline-flex;align-items:baseline;gap:6px;padding:4px 8px;border-radius:6px;background:var(--nw-hover);font-size:11px;max-width:100%}
.nw-state-key{color:var(--nw-text-3);white-space:nowrap}
.nw-state-value{font-family:var(--nw-serif);font-size:13px;color:var(--nw-text-1);overflow-wrap:anywhere}
.nw-state-ch{font-size:10px;color:var(--nw-text-3);white-space:nowrap}
.nw-recent{display:flex;flex-direction:column}
.nw-rrow{display:flex;align-items:center;gap:12px;height:40px;border-radius:8px;padding:0 12px;width:100%;text-align:left}
.nw-rrow:hover{background:var(--nw-hover)}
.nw-rrow-no{width:52px;flex:0 0 52px;font-size:11px;color:var(--nw-text-3);font-variant-numeric:tabular-nums}
.nw-rrow-title{flex:1 1 auto;min-width:0;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nw-rrow-words{flex:0 0 auto;font-size:11px;color:var(--nw-text-3);font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
.nw-rrow > .nw-tag{flex:0 0 auto}
.nw-info{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px}

/* menus, dialog, toast */
.nw-layer{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.18);display:grid;place-items:center;padding:24px}
.nw-dialog{width:min(420px,100%);background:var(--nw-surface);border-radius:16px;box-shadow:var(--nw-shadow-float);padding:24px}
.nw-dialog-title{font-family:var(--nw-serif);margin:0;font-size:19px;font-weight:600}
.nw-dialog-body{margin:10px 0 0;font-size:13px;line-height:1.75;color:var(--nw-text-2)}
.nw-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:24px}
.nw-pro-card{margin-top:18px;padding:15px;border:1px solid var(--nw-border-strong);border-radius:14px;background:color-mix(in oklab,var(--nw-text-1) 3.5%,transparent);display:flex;flex-direction:column;gap:11px}
.nw-pro-title{margin:0;font-size:14px;font-weight:600;letter-spacing:.02em}
.nw-pro-body{margin:0;font-size:12px;line-height:1.8;color:var(--nw-text-2)}
.nw-pro-note{margin:0;font-size:10.5px;line-height:1.7;color:var(--nw-text-3)}
.nw-pro-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.nw-pro-primary{display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 13px;border-radius:999px;background:var(--nw-primary);color:var(--nw-primary-fg);font-size:11.5px;letter-spacing:.02em;transition:transform .2s,box-shadow .2s}
.nw-pro-primary:hover{transform:translateY(-1px);box-shadow:0 6px 14px -8px rgba(0,0,0,.4)}
.nw-pro-site{display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 11px;border-radius:999px;border:1px solid var(--nw-border);font-size:11.5px;color:var(--nw-text-2);transition:color .2s,border-color .2s}
.nw-pro-site:hover{color:var(--nw-text-1);border-color:var(--nw-border-strong)}
.nw-footer-contact{pointer-events:auto;background:none;border:0;color:inherit;font:inherit;letter-spacing:inherit;cursor:pointer;padding:0;transition:color .2s}
.nw-footer-contact:hover{color:var(--nw-text-1)}
.nw-contact-dialog{position:relative;width:min(620px,100%);max-height:calc(100vh - 48px);overflow:auto;padding:28px}
.nw-contact-close{position:absolute;right:14px;top:14px;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;color:var(--nw-text-2);transition:background .2s,color .2s}
.nw-contact-close:hover{background:color-mix(in oklab,var(--nw-text-1) 7%,transparent);color:var(--nw-text-1)}
.nw-contact-head{display:flex;align-items:center;gap:16px;padding-right:32px}
.nw-contact-avatar{width:66px;height:66px;border-radius:50%;object-fit:cover;border:1px solid var(--nw-border);flex:0 0 auto}
.nw-contact-name{font-family:var(--nw-serif);margin:0;font-size:24px;font-weight:600}
.nw-contact-role{display:inline-block;margin-top:6px;padding:3px 10px;border:1px solid var(--nw-border-strong);border-radius:999px;font-size:11px;letter-spacing:.04em;color:var(--nw-text-2)}
.nw-contact-bio{margin:18px 0 0;font-size:13.5px;line-height:1.95;color:var(--nw-text-2)}
.nw-contact-github{display:inline-flex;align-items:center;gap:6px;margin-top:14px;font-size:12px;letter-spacing:.02em;color:var(--nw-text-1);border-bottom:1px solid var(--nw-border);padding-bottom:2px;transition:border-color .2s}
.nw-contact-github:hover{border-color:var(--nw-text-2)}
.nw-contact-hint{margin-top:18px;font-size:11px;letter-spacing:.05em;color:var(--nw-text-3)}
.nw-contact-qrs{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px}
.nw-qr-card{margin:0;padding:12px;border:1px solid var(--nw-border);border-radius:14px;background:color-mix(in oklab,var(--nw-text-1) 3.5%,transparent);display:flex;flex-direction:column;align-items:center;gap:10px}
.nw-qr-img{width:100%;max-width:220px;aspect-ratio:1;display:block;background:#fff;border-radius:8px;padding:6px;object-fit:contain}
.nw-qr-card figcaption{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12px;color:var(--nw-text-1)}
.nw-qr-card figcaption span{font-size:10px;letter-spacing:.08em;color:var(--nw-text-3)}
.nw-contact-foot{margin:18px 0 0;text-align:center;font-family:var(--nw-serif);font-size:12px;letter-spacing:.08em;color:var(--nw-text-3)}
@media (max-width:560px){.nw-contact-qrs{grid-template-columns:1fr}.nw-qr-img{max-width:200px}.nw-contact-dialog{padding:22px}}
.nw-menu{position:fixed;z-index:90;min-width:180px;padding:4px;border-radius:14px;background:var(--nw-surface);border:1px solid var(--nw-border);box-shadow:var(--nw-shadow-float)}
.nw-menu-item{width:100%;display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:8px;font-size:12px;text-align:left;color:var(--nw-text-1)}
.nw-menu-item:hover{background:var(--nw-hover)}
.nw-menu-item.is-danger{color:var(--nw-danger)}
.nw-toast{position:fixed;right:20px;bottom:20px;z-index:95;display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:var(--nw-surface);border:1px solid var(--nw-border);box-shadow:var(--nw-shadow-float);font-size:12px;color:var(--nw-text-1)}

/* narrow workbench */
@container (max-width:1180px){
  .nw-panel{display:none}
  .nw-panel.is-open{display:flex;position:absolute;right:0;top:4px;bottom:0;z-index:40;margin-left:0;box-shadow:var(--nw-shadow-float)}
}
@container (max-width:900px){
  .nw-directory{display:none}
  .nw-directory.is-open{display:flex;position:absolute;left:64px;top:4px;bottom:0;z-index:45;box-shadow:var(--nw-shadow-float)}
  .nw-work{overflow:visible}
  .nw-content{border-radius:16px;overflow:hidden}
  .nw-appbar-sub{display:none}
}
@container (max-width:720px){
  .nw-rail{width:56px;flex-basis:56px}
  .nw-rail-item{width:44px;height:46px}
  .nw-rail-item .nw-rail-label{display:none}
  .nw-appbar{padding:0 8px 0 10px;gap:4px}
  .nw-appbar .nw-hide-narrow{display:none}
  .nw-page-edit .nw-reading-edit{padding:32px 24px 64px}
  /* Keep the tab bar instead of turning it into a select. The toolbar wraps:
     breadcrumb/title on one row, tabs and actions below it. */
  .nw-ctoolbar{height:auto;min-height:56px;flex-wrap:wrap;padding:8px 12px;row-gap:6px;column-gap:8px}
  .nw-ctoolbar-lead{flex:1 1 100%}
  .nw-ctools{flex:1 1 100%;justify-content:flex-end;flex-wrap:wrap;margin-left:0}
  .nw-ctoolbar.is-editing{height:48px;min-height:48px;flex-wrap:nowrap;padding:0 12px}
  .nw-ctoolbar.is-editing .nw-ctoolbar-lead{flex:1 1 auto}
  .nw-ctools .nw-hide-narrow{display:none}
  .nw-reading,.nw-editor-wrap,.nw-writing{padding:32px 24px 64px}
  .nw-frow{grid-template-columns:1fr auto}
  .nw-frow-id{grid-column:1 / -1;padding-top:0}
  .nw-state-row{grid-template-columns:1fr}
  .nw-ov{padding:24px 24px 48px}
  .nw-ov-hero{grid-template-columns:72px minmax(0,1fr);column-gap:18px}
  .nw-ov-cover{width:72px;height:108px}
  .nw-body{padding:4px 8px 8px 0}
  .nw-directory.is-open{left:56px}
}

/* narrow shelf */
@container (max-width:1180px){
  .nw-shelf{--shelf-info-h:370px}
  .nw-shelf .nw-stage{grid-template-columns:minmax(0,470px) minmax(0,1fr);padding:36px 40px 36px 48px}
  .nw-shelf .nw-book-title{font-size:54px}
  .nw-shelf .nw-card.is-hero{width:270px;height:405px;margin:-202px 0 0 -135px}
  .nw-shelf .nw-card.is-side{width:150px;height:225px;margin-top:-100px}
  .nw-shelf .nw-card.is-left{left:8px}
  .nw-shelf .nw-card.is-right{right:28px}
  .nw-shelf .nw-big-number{font-size:210px;top:-30px}
  .nw-shelf .nw-footer{left:48px;right:40px}
}
@container (max-width:900px){
  .nw-shelf .nw-stage{grid-template-columns:1fr;grid-template-rows:auto auto auto;grid-template-areas:"copy" "gallery" "index";padding:22px 32px 24px;overflow:auto}
  .nw-shelf .nw-copy{height:auto;overflow:visible;padding-right:0}
  .nw-shelf .nw-index{padding:18px 0 0;max-height:270px}
  .nw-shelf .nw-index-list{max-height:220px}
  .nw-shelf .nw-book-title{font-size:50px;margin-top:14px}
  .nw-shelf .nw-synopsis{max-width:34em}
  .nw-shelf .nw-gallery{height:430px;margin-top:14px}
  .nw-shelf .nw-card.is-hero{width:220px;height:330px;margin:-165px 0 0 -110px;top:48%}
  .nw-shelf .nw-card.is-side{width:120px;height:180px;margin-top:-82px}
  .nw-shelf .nw-big-number{font-size:150px;right:-6px;top:-14px}
  .nw-shelf .nw-glow{width:420px;height:420px;margin:-210px 0 0 -210px}
  .nw-shelf .nw-footer{display:none}
  .nw-root.is-mac-titlebar .nw-topbar{padding-left:160px}
.nw-topbar{padding:0 24px;height:46px;flex-basis:46px}
}
@container (max-width:620px){
  .nw-topbar-actions .nw-pro-entry.nw-hide-narrow{display:none}
  .nw-shelf .nw-stage{padding:16px 22px 22px}
  .nw-shelf .nw-book-title{font-size:38px}
  .nw-shelf .nw-synopsis{font-size:13px;line-height:1.85;margin-top:16px}
  .nw-shelf .nw-meta{font-size:10px}
  .nw-shelf .nw-actions{margin-top:22px;gap:14px}
  .nw-shelf .nw-gallery{height:360px}
  .nw-shelf .nw-card.is-hero{width:184px;height:276px;margin:-128px 0 0 -92px}
  .nw-shelf .nw-card.is-side{display:none}
  .nw-shelf .nw-big-number{font-size:120px}
  .nw-shelf .nw-irow{height:42px}
  .nw-shelf-empty{padding:24px 22px}
  .nw-shelf-empty-title{font-size:52px}
}

/* structured content */
.nw-md-list,.nw-reading-list{margin:10px 0 0;padding-left:1.3em;font-family:var(--nw-serif);font-size:15.5px;line-height:1.9;color:var(--nw-text-1)}
.nw-md-list li,.nw-reading-list li{margin:4px 0}
.nw-reading h3{margin:22px 0 8px;font-size:15px;font-weight:600}
.nw-field{padding:10px 0;border-bottom:1px solid var(--nw-border)}
.nw-field:last-child{border-bottom:0}
.nw-field-label{font-size:11px;color:var(--nw-text-3);letter-spacing:.04em;margin-bottom:4px}
.nw-field-value{font-family:var(--nw-serif);font-size:15.5px;line-height:1.9;white-space:pre-wrap}
.nw-outline-volume{padding:16px 0;border-bottom:1px solid var(--nw-border)}
.nw-outline-volume:last-child{border-bottom:0}
.nw-outline-volume h3{margin:0 0 6px;font-size:16px;font-weight:600}
.nw-outline-arc{margin-top:10px;padding-left:12px;border-left:1px solid var(--nw-border)}
.nw-outline-arc strong{font-size:13px}
.nw-premise-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.nw-premise-card{background:var(--nw-hover);border-radius:10px;padding:16px}
.nw-premise-card h3{margin:0 0 10px;font-size:14px;font-weight:600}
.nw-premise-field{padding:8px 0;border-bottom:1px solid var(--nw-border)}
.nw-premise-field:last-child{border-bottom:0}
.nw-premise-key{font-size:10px;color:var(--nw-text-3);letter-spacing:.04em}
.nw-premise-value{font-family:var(--nw-serif);font-size:14.5px;line-height:1.8;margin-top:3px;white-space:pre-wrap}
.nw-pre{margin:0;font-family:var(--nw-mono);font-size:12.5px;line-height:1.7;white-space:pre-wrap;word-break:break-word}
.nw-memory-row{display:flex;align-items:center;gap:12px;min-height:44px;padding:8px 12px;border-radius:8px;text-align:left;width:100%}
.nw-memory-row:hover{background:var(--nw-hover)}
.nw-scene{padding:12px 0;border-bottom:1px solid var(--nw-border)}
.nw-scene:last-child{border-bottom:0}
.nw-scene-head{font-size:14px;font-weight:600;margin-bottom:6px}
.nw-scene-text{font-family:var(--nw-serif);font-size:14.5px;line-height:1.85;margin:6px 0 0;color:var(--nw-text-2)}
.nw-memory-row .nw-rrow-title{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:12.5px;line-height:1.6;font-family:var(--nw-serif)}


/* context panel chat */
.nw-chat{display:flex;flex-direction:column;height:100%;min-height:0}
.nw-chat-scroll{flex:1 1 auto;min-height:0;overflow:auto;padding:14px 16px 24px}
.nw-chat-row{margin:0 0 12px}
.nw-chat-role{font-size:10px;letter-spacing:.12em;color:var(--nw-text-3);margin-bottom:4px}
.nw-chat-text{font-family:var(--nw-serif);font-size:14px;line-height:1.85;white-space:pre-wrap;word-break:break-word}
.nw-chat-row.is-user .nw-chat-text{font-family:var(--nw-font);font-size:13px;background:var(--nw-hover);border-radius:8px;padding:8px 10px}
.nw-chat-row.is-tool .nw-chat-text{font-family:var(--nw-mono);font-size:11px;color:var(--nw-text-3)}
.nw-chat-hint{flex:0 0 auto;padding:8px 14px;border-top:1px solid var(--nw-border);font-size:11px;color:var(--nw-text-3)}
.nw-chat-empty{margin:auto;padding:24px;text-align:center;color:var(--nw-text-3);font-size:12px}
/* right-sidebar book cockpit: stage-aware board, reader, live sync */
.nw-p2{display:flex;flex-direction:column;height:100%;min-height:0;position:relative;background:var(--nw-surface);color:var(--nw-text-1);font-family:var(--nw-font);container-type:inline-size;container-name:nw-p2}
.nw-p2 *{box-sizing:border-box}
.nw-p2 button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.nw-p2 svg{display:block;flex:0 0 auto}
.nw-p2-head{flex:0 0 auto;border-bottom:1px solid var(--nw-border);background:linear-gradient(180deg,color-mix(in oklab,var(--nw-text-1) 2%,var(--nw-surface)),var(--nw-surface))}
.nw-p2-head-inner{display:flex;align-items:flex-start;gap:10px;padding:12px 13px 9px;width:100%;max-width:1086px;margin:0 auto}
.nw-p2-cover{width:38px;height:56px;flex:0 0 38px;border-radius:3px;overflow:hidden;box-shadow:0 7px 16px -9px rgba(0,0,0,.42)}
.nw-p2-id{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px}
.nw-p2-titlerow{display:flex;align-items:center;gap:7px;min-width:0}
.nw-p2-title{font-family:var(--nw-serif);font-size:16px;line-height:1.25;font-weight:600;margin:0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.01em}
.nw-p2-meta{display:flex;flex-wrap:wrap;align-items:center;gap:0 7px;font-size:10.5px;line-height:1.55;color:var(--nw-text-3);font-variant-numeric:tabular-nums;min-width:0}
.nw-p2-meta > span{white-space:nowrap;min-width:0;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.nw-p2-live{display:inline-flex;align-items:center;gap:4px;color:var(--nw-text-2)}
.nw-p2-live.is-busy{color:var(--nw-text-1)}
.nw-p2-live.is-fresh{color:var(--nw-success)}
.nw-p2-pulse{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--nw-success);animation:nw-pulse 1.6s ease-in-out infinite;flex:0 0 6px}
.nw-p2-synced{color:var(--nw-text-3);white-space:nowrap}
.nw-p2-steps{display:flex;align-items:center;gap:0;margin-top:3px;overflow:hidden;min-width:0}
.nw-p2-step{display:flex;align-items:center;gap:5px;font-size:9.5px;color:var(--nw-text-3);white-space:nowrap;flex:0 0 auto;line-height:1.4}
.nw-p2-step + .nw-p2-step{margin-left:4px}
.nw-p2-step:not(:last-child)::after{content:"";width:13px;height:1px;background:var(--nw-border);margin-left:4px;flex:0 0 13px}
.nw-p2-step.is-done{color:var(--nw-text-2)}
.nw-p2-step.is-active{color:var(--nw-text-1);font-weight:600}
.nw-p2-tools{display:flex;align-items:center;gap:1px;flex:0 0 auto;margin-left:auto;margin-top:-2px}
.nw-p2 .is-spinning svg{animation:nw-spin .8s linear infinite}
.nw-p2-scroll{flex:1 1 auto;min-height:0;overflow:auto;padding:12px 13px 22px;overscroll-behavior:contain}
.nw-p2-grid{display:flex;flex-direction:column;gap:15px;min-width:0}
.nw-p2-main,.nw-p2-aside{display:flex;flex-direction:column;gap:15px;min-width:0}
.nw-p2-only-wide{display:none}

/* next step */

/* sections */
.nw-p2-crows{display:flex;flex-direction:column;min-width:0}
.nw-p2-checkrow{display:flex;align-items:flex-start;gap:7px;text-align:left;width:100%;padding:5.5px 0;border-bottom:1px solid var(--nw-border);min-width:0}
.nw-p2-checkrow:last-child{border-bottom:0}
.nw-p2-checkrow:hover .nw-p2-checkrow-label{color:var(--nw-text-1)}
.nw-p2-dot{width:6px;height:6px;border-radius:50%;flex:0 0 6px;margin-top:5px;background:var(--nw-border-strong)}
.nw-p2-dot.is-done{background:var(--nw-success)}
.nw-p2-dot.is-warn,.nw-p2-dot.is-plan{background:var(--nw-warn)}
.nw-p2-dot.is-info{background:var(--nw-text-3)}
.nw-p2-dot.is-idle{background:var(--nw-border-strong)}
.nw-p2-checkrow-label{flex:0 1 auto;min-width:0;max-width:46%;font-size:11.5px;color:var(--nw-text-2);line-height:1.55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nw-p2-checkrow-detail{flex:1 1 auto;min-width:0;font-size:11.5px;color:var(--nw-text-1);line-height:1.55;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;text-align:right}
.nw-p2-checkrow.is-done .nw-p2-checkrow-detail{color:var(--nw-text-2)}
.nw-p2-checkrow.is-content .nw-p2-checkrow-label{flex:0 0 78px;max-width:78px;white-space:normal;line-height:1.45;font-weight:500;color:var(--nw-text-2)}
.nw-p2-checkrow.is-content .nw-p2-checkrow-detail{text-align:left;color:var(--nw-text-2)}
.nw-p2-hint{font-size:11px;line-height:1.65;color:var(--nw-text-2);margin:8px 0 0}
.nw-p2-hint.is-good{color:var(--nw-success)}
.nw-p2-note{font-size:10.5px;line-height:1.6;color:var(--nw-text-3);margin:6px 0 0}
.nw-p2-quote{font-family:var(--nw-serif);font-size:12px;line-height:1.75;color:var(--nw-text-1);margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.nw-p2-synopsis{font-family:var(--nw-serif);font-size:12.5px;line-height:1.8;color:var(--nw-text-1);margin:0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.nw-p2-synopsis.is-empty{color:var(--nw-text-3)}
.nw-p2-facts{display:flex;flex-wrap:wrap;gap:4px 11px;margin-top:8px;font-size:10px;color:var(--nw-text-2);font-variant-numeric:tabular-nums}
.nw-p2-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}
.nw-p2-meta-tag{display:inline-flex;align-items:center;height:18px;padding:0 6px;border-radius:5px;background:var(--nw-hover);font-size:9px;color:var(--nw-text-3);white-space:nowrap}
.nw-p2-focus{display:block;width:100%;text-align:left;padding:10px 11px;border-radius:10px;border:1px solid var(--nw-border);background:linear-gradient(180deg,var(--nw-surface),var(--nw-hover));min-width:0}
.nw-p2-focus:hover{background:var(--nw-active)}
.nw-p2-memo{margin-top:9px;padding:9px 10px;border-radius:9px;background:var(--nw-hover)}
.nw-p2-memo-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:9.5px;color:var(--nw-text-3);margin-bottom:4px}
.nw-p2-memo p{font-family:var(--nw-serif);font-size:11.5px;line-height:1.7;color:var(--nw-text-2);margin:0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.nw-p2-inline-link{font-size:10px;color:var(--nw-text-2);border-bottom:1px solid var(--nw-border-strong);padding-bottom:1px;margin-top:6px}
.nw-p2-inline-link:hover{color:var(--nw-text-1)}
.nw-p2-chrow{display:flex;align-items:center;gap:7px;width:100%;text-align:left;padding:5px 4px;border-radius:6px;border-bottom:1px solid var(--nw-border);min-width:0}
.nw-p2-chrow:last-child{border-bottom:0}
.nw-p2-chrow:hover{background:var(--nw-hover)}
.nw-p2-chrow.is-active{background:var(--nw-active)}
.nw-p2-chrow .nw-p2-dot{margin:0}
.nw-p2-firstchapter{margin-top:9px;padding:9px 10px;border-radius:9px;border:1px solid var(--nw-border)}
.nw-p2-inline-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.nw-p2-empty-inline{font-size:10.5px;color:var(--nw-text-3);line-height:1.6}

/* sticky prompt row */
.nw-p2-foot{flex:0 0 auto;border-top:1px solid var(--nw-border);overflow-x:auto;background:var(--nw-surface);scrollbar-width:none}
.nw-p2-foot-inner{display:flex;align-items:center;gap:5px;padding:8px 12px;width:100%;max-width:1086px;margin:0 auto}
.nw-p2-foot::-webkit-scrollbar{display:none}
.nw-p2-notice{position:absolute;left:12px;right:12px;bottom:44px;z-index:8;padding:7px 10px;border-radius:8px;background:var(--nw-text-1);color:var(--nw-primary-fg);font-size:10.5px;line-height:1.5;box-shadow:var(--nw-shadow-float)}

/* chapter reader */
.nw-p2-reader{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
.nw-p2-readerbar{flex:0 0 auto;display:flex;align-items:center;gap:5px;padding:7px 10px;border-bottom:1px solid var(--nw-border);min-width:0}
.nw-p2-readertitle{flex:1 1 auto;min-width:0;margin-left:2px}
.nw-p2-reader-no{font-size:9px;letter-spacing:.08em;color:var(--nw-text-3)}
.nw-p2-reader-name{font-family:var(--nw-serif);font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.35}
.nw-p2-readertools{display:flex;align-items:center;gap:1px;flex:0 0 auto}
.nw-p2-readerscroll{flex:1 1 auto;min-height:0;overflow:auto;padding:12px 16px 28px}
.nw-p2-readermeta{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}
.nw-p2-readerstate{display:flex;align-items:center;gap:8px;padding:16px 0;color:var(--nw-text-3);font-size:11px}
.nw-p2-readerstate.is-error{flex-direction:column;align-items:flex-start;color:var(--nw-danger)}

/* loading, empty and errors */
.nw-p2-skeleton{padding:14px;display:flex;flex-direction:column;gap:8px}
.nw-p2-skeleton-card{height:74px;border-radius:10px;background:var(--nw-hover);animation:nw-pulse 1.4s ease-in-out infinite}
.nw-p2-skeleton-line{height:10px;border-radius:4px;background:var(--nw-hover);animation:nw-pulse 1.4s ease-in-out infinite}
.nw-p2-skeleton-line.is-wide{width:86%}
.nw-p2-skeleton-line.is-short{width:56%}
.nw-p2-empty{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;padding:28px 20px;color:var(--nw-text-3)}
.nw-p2-empty-mark{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--nw-hover);color:var(--nw-text-2)}
.nw-p2-empty h2{margin:2px 0 0;font-family:var(--nw-serif);font-size:15px;font-weight:600;color:var(--nw-text-1)}
.nw-p2-empty p{margin:0;font-size:10.5px;line-height:1.65;max-width:30ch}
.nw-p2-empty.is-error .nw-p2-empty-mark{color:var(--nw-danger)}

/* the panel is often docked or dragged narrow: keep hierarchy, drop chrome */
@container nw-p2 (min-width:620px){
  .nw-p2-grid{display:grid;grid-template-columns:minmax(0,1fr) 214px;gap:18px;align-items:start}
  .nw-p2-aside{position:sticky;top:0}
  .nw-p2-only-wide{display:block}
  .nw-p2-only-narrow{display:none}
}
@container nw-p2 (max-width:360px){
  .nw-p2-head-inner{padding:10px 10px 8px;gap:8px}
  .nw-p2-cover{display:none}
  .nw-p2-title{font-size:14px}
  .nw-p2-scroll{padding:10px 10px 18px}
  .nw-p2-step:not(.is-active) .nw-p2-step-label{display:none}
  .nw-p2-step:not(:last-child)::after{width:9px;flex-basis:9px}
  .nw-p2-next{padding:11px 12px 10px}
  .nw-p2-checkrow-label{max-width:42%}
  .nw-p2-foot-inner{padding:7px 9px}
}
@container nw-p2 (max-width:300px){
  .nw-p2-meta{font-size:9px;gap:0 5px}
  .nw-p2-readerscroll{padding:10px 12px 24px}
}

/* journey: the one next step, four stages, and the health checklist */
.nw-jsteps{display:flex;align-items:center;gap:0;margin:2px 0 18px;max-width:560px}
.nw-jstep{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--nw-text-3);white-space:nowrap}
.nw-jstep-dot{width:7px;height:7px;border-radius:50%;background:var(--nw-border-strong);flex:0 0 auto}
.nw-jstep-line{width:34px;height:1px;background:var(--nw-border);margin:0 8px;flex:0 0 34px}
.nw-jstep.is-done{color:var(--nw-text-2)}
.nw-jstep.is-done .nw-jstep-dot{background:color-mix(in oklab,var(--nw-success) 55%,transparent)}
.nw-jstep.is-active{color:var(--nw-text-1);font-weight:600}
.nw-jstep.is-active .nw-jstep-dot{background:var(--nw-text-1);box-shadow:0 0 0 3px color-mix(in oklab,var(--nw-text-1) 10%,transparent)}
.nw-journey{position:relative;padding:22px 24px;border-radius:14px;background:var(--nw-surface);box-shadow:var(--nw-shadow-card);margin:4px 0 22px;overflow:hidden}
.nw-journey::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--nw-text-1);opacity:.82}
.nw-journey-kicker{font-size:10px;letter-spacing:.14em;color:var(--nw-text-3);text-transform:uppercase}
.nw-journey-title{font-family:var(--nw-serif);font-size:21px;font-weight:600;margin:7px 0 0;letter-spacing:.01em}
.nw-journey-desc{font-size:13px;color:var(--nw-text-2);margin:7px 0 0;line-height:1.75;max-width:52ch}
.nw-journey-actions{display:flex;align-items:center;gap:10px;margin-top:16px;flex-wrap:wrap}
.nw-journey-hints{display:flex;flex-direction:column;gap:4px;margin-top:14px;padding-top:12px;border-top:1px solid var(--nw-border)}
.nw-journey-hint{font-size:11.5px;color:var(--nw-text-3);line-height:1.65}
.nw-health{margin:0 0 20px;padding:12px 2px 0;border-top:1px solid var(--nw-border)}
.nw-health-head{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.08em;color:var(--nw-text-3);margin-bottom:7px}
.nw-health-head button{margin-left:auto;color:var(--nw-text-2);font-size:11px}
.nw-health-head button:hover{text-decoration:underline}
.nw-health-row{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--nw-text-2);line-height:1.6;padding:2px 0}
.nw-health-dot{width:6px;height:6px;border-radius:50%;margin-top:6px;flex:0 0 6px;background:var(--nw-text-3)}
.nw-health-dot.is-warn{background:var(--nw-warn)}
.nw-health-dot.is-good{background:var(--nw-success)}
.nw-health-dot.is-info{background:var(--nw-text-3)}
.nw-health-note{color:var(--nw-text-3);font-size:11px;margin-left:auto;flex:0 0 auto}

/* create-book and export dialogs */
.nw-dialog.is-wide{width:min(560px,100%);max-height:min(760px,calc(100vh - 48px));overflow:auto}
.nw-form{display:grid;gap:14px;margin-top:20px}
.nw-form-row{display:grid;gap:6px;min-width:0}
.nw-form-label{font-size:12px;color:var(--nw-text-2);font-weight:500}
.nw-form-label em{font-style:normal;color:var(--nw-text-3);font-weight:400}
.nw-input,.nw-textarea,.nw-select{width:100%;background:var(--nw-canvas);border:1px solid var(--nw-border);border-radius:9px;padding:9px 11px;font:inherit;font-size:13px;color:var(--nw-text-1);outline:none;transition:border-color .15s,box-shadow .15s}
.nw-input:focus,.nw-textarea:focus,.nw-select:focus{border-color:color-mix(in oklab,var(--nw-text-2) 55%,transparent);box-shadow:0 0 0 3px color-mix(in oklab,var(--nw-text-2) 10%,transparent)}
.nw-textarea{resize:vertical;min-height:72px;line-height:1.7}
.nw-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.nw-path{display:flex;align-items:center;gap:8px;background:var(--nw-hover);border-radius:9px;padding:8px 10px;font-size:11px;color:var(--nw-text-3);word-break:break-all;line-height:1.55}
.nw-path span{flex:1 1 auto;min-width:0}
.nw-form-error{color:var(--nw-danger);font-size:12px;line-height:1.6}
.nw-form-note{font-size:11px;color:var(--nw-text-3);line-height:1.65;margin:0}
.nw-export{display:grid;gap:16px;margin-top:18px}
.nw-choice-row{display:flex;gap:6px;flex-wrap:wrap}
.nw-choice{border:1px solid var(--nw-border);border-radius:9px;padding:8px 12px;font-size:12px;color:var(--nw-text-2);background:transparent}
.nw-choice:hover{background:var(--nw-hover);color:var(--nw-text-1)}
.nw-choice.is-active{border-color:var(--nw-text-1);color:var(--nw-text-1);background:color-mix(in oklab,var(--nw-text-1) 5%,transparent);font-weight:600}
.nw-check{display:flex;flex-direction:column;gap:6px;background:var(--nw-hover);border-radius:10px;padding:12px 14px}
.nw-check-title{font-size:11px;letter-spacing:.08em;color:var(--nw-text-3);margin-bottom:2px}
.nw-check-row{display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.65;color:var(--nw-text-2)}
.nw-check-row b{font-weight:600;color:var(--nw-text-1)}
.nw-download{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:color-mix(in oklab,var(--nw-success) 9%,transparent);color:var(--nw-text-1);font-size:12px;line-height:1.6}
.nw-download a{color:var(--nw-text-1);font-weight:600;text-decoration:underline;text-underline-offset:2px}
.nw-export-done{display:grid;gap:10px}
.nw-export-done h3{margin:0;font-size:14px;font-weight:600}
.nw-export-done p{margin:0;font-size:12px;color:var(--nw-text-2)}
/* Top bar utilities: one quiet link style for the site entry, the author, and
   the rescan action. No pills, no permanent underline; the icon is the only
   affordance difference and the underline appears on hover. */
.nw-topbar-actions{display:flex;align-items:center;gap:24px}
.nw-topbar-actions .nw-pro-entry,
.nw-topbar-actions .nw-contact-entry,
.nw-topbar-actions .nw-rescan{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0;border:0;border-radius:0;background:none;font:inherit;font-size:11px;letter-spacing:.08em;color:var(--nw-text-2);text-decoration:none;white-space:nowrap;cursor:pointer;transition:color .2s}
.nw-topbar-actions .nw-pro-entry svg,
.nw-topbar-actions .nw-contact-entry svg,
.nw-topbar-actions .nw-rescan svg{width:13px;height:13px;opacity:.7}
.nw-topbar-actions .nw-pro-entry:hover,
.nw-topbar-actions .nw-contact-entry:hover,
.nw-topbar-actions .nw-rescan:hover{color:var(--nw-text-1);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;text-decoration-color:color-mix(in oklab,var(--nw-text-1) 40%,transparent)}

/* visible tracking: progress, summaries, foreshadowing, character states */
.nw-track{padding:28px 40px 72px;max-width:980px;margin:0 auto}
.nw-track-note{font-size:11px;color:var(--nw-text-3);line-height:1.7;margin:0 0 18px}
.nw-track-hero{padding:4px 0 18px;border-bottom:1px solid var(--nw-border)}
.nw-track-hero-num{display:flex;align-items:baseline;gap:6px}
.nw-track-hero-num b{font-family:var(--nw-serif);font-size:38px;line-height:1;font-weight:600}
.nw-track-hero-num span{font-size:13px;color:var(--nw-text-2)}
.nw-track-hero p{font-size:12px;color:var(--nw-text-2);margin:8px 0 12px}
.nw-track-section{margin-top:26px}
.nw-track-section h3{font-size:12px;letter-spacing:.08em;color:var(--nw-text-3);font-weight:600;margin:0 0 10px;text-transform:uppercase}
.nw-track-vol{display:grid;grid-template-columns:1fr auto 120px;align-items:center;gap:12px;padding:6px 0;font-size:12px;color:var(--nw-text-2)}
.nw-track-vol b{font-weight:500;color:var(--nw-text-1);font-variant-numeric:tabular-nums}
.nw-track-next{font-family:var(--nw-serif);font-size:17px;margin:0 0 6px}
.nw-track-section .nw-btn{margin-top:10px}
.nw-track-issue{display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:12.5px;color:var(--nw-text-2);line-height:1.6}
.nw-track-issue em{font-style:normal;color:var(--nw-text-3);display:block;font-size:11px;margin-top:2px}
.nw-track-table-wrap{overflow:auto;border:1px solid var(--nw-border);border-radius:10px}
.nw-track-table{width:100%;border-collapse:collapse;font-size:12px;min-width:760px}
.nw-track-table th{text-align:left;font-weight:500;color:var(--nw-text-3);font-size:11px;letter-spacing:.04em;padding:9px 10px;border-bottom:1px solid var(--nw-border);background:var(--nw-hover)}
.nw-track-table td{padding:9px 10px;border-bottom:1px solid var(--nw-border);color:var(--nw-text-2);vertical-align:top;line-height:1.6}
.nw-track-table tr:last-child td{border-bottom:0}
.nw-track-mono{font-family:var(--nw-mono);font-size:10.5px;color:var(--nw-text-3);white-space:nowrap}
.nw-track-sum{padding:14px 0;border-bottom:1px solid var(--nw-border)}
.nw-track-sum:last-child{border-bottom:0}
.nw-track-sum-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.nw-track-sum-head b{font-family:var(--nw-serif);font-size:15px;font-weight:600}
.nw-track-sum-title{font-size:13px;color:var(--nw-text-2);flex:1 1 auto;min-width:0}
.nw-track-sum-head em{font-style:normal;font-size:11px;color:var(--nw-text-3);font-variant-numeric:tabular-nums}
.nw-track-sum-body{font-family:var(--nw-serif);font-size:13.5px;line-height:1.85;color:var(--nw-text-1);margin:7px 0 0;white-space:pre-wrap}
.nw-track-events{margin:8px 0 0;padding-left:18px;font-size:12px;line-height:1.7;color:var(--nw-text-2)}
.nw-track-people{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.nw-track-person{padding:14px 16px;border-radius:10px;background:var(--nw-surface);border:1px solid var(--nw-border);text-align:left;min-width:0}
.nw-track-person.is-link:hover{background:var(--nw-hover)}
.nw-track-person-head{display:flex;align-items:center;gap:8px}
.nw-track-person-head b{font-family:var(--nw-serif);font-size:15px}
.nw-track-states{display:flex;flex-wrap:wrap;gap:5px 12px;margin-top:9px}
.nw-track-state{font-size:11.5px;color:var(--nw-text-2);line-height:1.6}
.nw-track-state em{font-style:normal;color:var(--nw-text-3);margin-right:4px}
.nw-track-recent{margin-top:10px;padding-top:8px;border-top:1px solid var(--nw-border);font-size:11px}
.nw-track-change{color:var(--nw-text-2);line-height:1.6;margin-top:2px}
@media (max-width:900px){.nw-track{padding:22px 20px 56px}.nw-track-people{grid-template-columns:1fr}.nw-track-vol{grid-template-columns:1fr auto 80px}}

.nw-track-recent-row{display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid var(--nw-border);font-size:12px}
.nw-track-recent-row:last-child{border-bottom:0}
.nw-track-recent-title{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--nw-text-1)}

@media (prefers-reduced-motion:reduce){
  .nw-root *, .nw-root *::before, .nw-root *::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
  /* An indeterminate bar is meaningless when motion is gone: show a calm
     static fill and keep the writing page readable. */
  .nw-writing-bar i{animation:none !important;transform:none !important;width:100% !important;opacity:.35 !important}
  .nw-skel::after{animation:none !important;top:40% !important;opacity:.35 !important}
  .nw-writing-dots i{animation:none !important;opacity:.55 !important}
}

/* fullscreen or a deliberately wide sidebar: center the board instead of
   stretching a two-column mobile layout across the whole window */
@container nw-p2 (min-width:900px){
  .nw-p2-grid{max-width:1060px;margin:0 auto;grid-template-columns:minmax(0,1fr) 280px;gap:28px}
  .nw-p2-head-inner,.nw-p2-foot-inner{max-width:1086px}
}
@container nw-p2 (min-width:1200px){
  .nw-p2-grid{max-width:1140px;grid-template-columns:minmax(0,1fr) 300px;gap:32px}
  .nw-p2-head-inner,.nw-p2-foot-inner{max-width:1166px}
}

/* the side panel reuses the workbench's own blocks, only denser */
.nw-p2 .nw-section{margin-top:0}
.nw-p2 .nw-sec-head{margin-bottom:7px;flex-wrap:nowrap}
.nw-p2 .nw-sec-head h2{font-size:14px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nw-p2 .nw-sec-head .nw-btn{flex:0 0 auto}
.nw-p2 .nw-journey{margin:0;padding:18px 20px 16px;border-radius:14px}
.nw-p2 .nw-journey-title{font-size:20px}
.nw-p2 .nw-journey-desc{font-size:12.5px;line-height:1.7;margin-top:5px}
.nw-p2 .nw-journey-actions{margin-top:12px}
.nw-p2 .nw-journey-hints{margin-top:10px;padding-top:10px}
.nw-p2 .nw-journey-hint{display:flex;align-items:center;gap:5px;font-size:11px}
.nw-p2 .nw-journey-hint.is-waiting{color:var(--nw-warn)}
.nw-p2 .nw-p2-steps{margin:2px 0 0;max-width:none}
.nw-p2 .nw-p2-step{font-size:10px;gap:5px}
.nw-p2 .nw-p2-step::after{display:none}
.nw-p2 .nw-p2-step .nw-jstep-line{width:10px;flex:0 0 10px;margin:0 4px}
.nw-p2 .nw-p2-stats{margin:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
.nw-p2 .nw-p2-stats .nw-bigstat{padding:9px 10px 8px;border-radius:9px;text-align:left}
.nw-p2 .nw-bigstat b{font-size:19px}
.nw-p2 .nw-bigstat span{margin-top:4px;font-size:10px}
.nw-p2 .nw-p2-checkrow{width:100%;text-align:left;padding:5px 0;border-bottom:1px solid var(--nw-border);gap:7px}
.nw-p2 .nw-p2-checkrow:last-child{border-bottom:0}
.nw-p2 .nw-p2-checkrow .nw-p2-checkrow-label{font-size:11.5px;font-weight:500;color:var(--nw-text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nw-p2 .nw-p2-checkrow .nw-p2-checkrow-detail{flex:1 1 auto;min-width:0;font-size:11.5px;color:var(--nw-text-1);line-height:1.55;text-align:right;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.nw-p2 .nw-p2-checkrow.is-content .nw-p2-checkrow-label{flex:0 0 78px;max-width:78px;white-space:normal;font-weight:500}
.nw-p2 .nw-p2-checkrow.is-content .nw-p2-checkrow-detail{text-align:left;color:var(--nw-text-2)}
.nw-p2 .nw-p2-checkrow .nw-dot{margin-top:4px}
.nw-p2 .nw-p2-chrow{height:33px;padding:0 2px;gap:8px;border-bottom:1px solid var(--nw-border);border-radius:0}
.nw-p2 .nw-p2-chrow:last-child{border-bottom:0}
.nw-p2 .nw-p2-chrow.is-active{background:var(--nw-active)}
.nw-p2 .nw-p2-chrow .nw-rrow-no{width:auto;flex:0 0 auto;font-size:9.5px}
.nw-p2 .nw-p2-chrow .nw-rrow-title{font-size:12px}
.nw-p2 .nw-p2-chrow .nw-rrow-words{font-size:9.5px}
.nw-p2 .nw-p2-chrow .nw-dot{margin:0}
.nw-p2 .nw-p2-foot{display:block;padding:0;border-top:1px solid var(--nw-border);overflow-x:auto;background:var(--nw-surface)}
.nw-p2 .nw-p2-foot-inner{display:flex;align-items:center;gap:6px;padding:8px 12px;width:100%;margin:0 auto}
.nw-p2 .nw-tag{max-width:100%;overflow:hidden;text-overflow:ellipsis}
.nw-p2 .nw-tag.is-link:hover{background:var(--nw-active);color:var(--nw-text-1)}
.nw-p2 .nw-p2-meta-tag{height:18px;padding:0 5px;font-size:9.5px}
.nw-p2 .nw-kv{font-size:11.5px;line-height:1.7;gap:8px}
.nw-p2 .nw-kv dt{width:72px;flex:0 0 72px}
.nw-p2 .nw-kv dd{color:var(--nw-text-2)}


.nw-p2 .nw-p2-reading{padding:0;max-width:760px;margin:0 auto;font-size:14px;line-height:1.9}
.nw-p2 .nw-p2-reading .nw-reading-title{font-size:18px;line-height:1.4;margin:0 0 12px}
.nw-p2 .nw-p2-reading .nw-reading-kicker{font-size:10px;margin-bottom:8px}
.nw-p2 .nw-p2-reading .nw-reading-list{font-size:13px;line-height:1.8;margin-top:6px}
.nw-p2 .nw-p2-reading .nw-field{padding:7px 0}
.nw-p2 .nw-p2-reading .nw-field-label{font-size:10px;margin-bottom:2px}
.nw-p2 .nw-p2-reading .nw-field-value{font-size:13.5px;line-height:1.8}
.nw-p2 .nw-p2-firstchapter{margin-top:9px;padding:10px 12px;border:1px solid var(--nw-border);border-radius:9px}
.nw-p2 .nw-p2-focus{display:block;width:100%;text-align:left;padding:10px 12px;border-radius:10px;background:var(--nw-hover);border:0}
.nw-p2 .nw-p2-focus:hover{background:var(--nw-active)}
.nw-p2 .nw-p2-focus .nw-reading-title{font-size:15px;margin:0 0 8px}
.nw-p2 .nw-p2-focus .nw-reading-kicker{margin-bottom:3px}
.nw-p2 .nw-p2-memo{margin-top:9px}
.nw-p2 .nw-p2-memo .nw-check-title{display:flex;align-items:center;justify-content:space-between;gap:8px}
.nw-p2 .nw-p2-memo .nw-track-sum-body{margin-top:4px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.nw-p2 .nw-p2-memo .nw-btn{align-self:flex-start;margin-top:2px;padding:0 8px}
.nw-dot.is-warn{background:var(--nw-warn)}
.nw-dot.is-info{background:var(--nw-text-3)}
.nw-p2 .nw-check-row.is-static{cursor:default}

.nw-p2 .nw-p2-meta{margin-top:0}
.nw-p2 .nw-outline-volume{padding:8px 0}
.nw-p2 .nw-outline-volume h3{font-size:13px;margin-bottom:3px}
.nw-p2 .nw-outline-volume p{margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
`
