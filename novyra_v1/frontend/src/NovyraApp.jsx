import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Droplets, Sprout, CloudSun, ChevronLeft, ChevronRight,
  Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2, Check,
  User, Plus, Sparkles, Bell, MapPin, Zap, Home, Wind,
  Thermometer, AlertTriangle, Trash2, Edit3, BarChart2,
  LogOut, Camera, Shield, HelpCircle, TrendingUp, TrendingDown,
  Minus, Sun, Cloud, CloudRain, CloudLightning, Tractor,
  Layers, Circle, RefreshCw, SlidersHorizontal, FlaskConical,
  Leaf, Award, ChevronDown, ChevronUp,
} from "lucide-react";
import { fetchPrediction } from "./api.js";

/* ─────────────────────────────────────────────────────────────────────
   GLOBAL SENSOR DEFAULTS  (lifted here so every screen shares them)
───────────────────────────────────────────────────────────────────── */
const DEFAULT_SENSORS = { pH:6.4, N:78, P:42, K:95, temperature:29, humidity:68, pressure:101, moisture:54 };

const SENSOR_META = {
  pH:          { label:"Soil pH",         unit:"",        min:0,   max:14,  step:0.1, ideal:"6.0 – 7.0" },
  N:           { label:"Nitrogen",        unit:"mg/kg",   min:0,   max:300, step:1,   ideal:"60 – 120" },
  P:           { label:"Phosphorus",      unit:"mg/kg",   min:0,   max:200, step:1,   ideal:"40 – 80" },
  K:           { label:"Potassium",       unit:"mg/kg",   min:0,   max:300, step:1,   ideal:"80 – 150" },
  temperature: { label:"Air temperature", unit:"°C",      min:0,   max:60,  step:0.5, ideal:"20 – 35" },
  humidity:    { label:"Humidity",        unit:"%",       min:0,   max:100, step:1,   ideal:"50 – 80" },
  pressure:    { label:"Pressure",        unit:"hPa",     min:90,  max:110, step:0.5, ideal:"98 – 105" },
  moisture:    { label:"Soil moisture",   unit:"%",       min:0,   max:100, step:1,   ideal:"40 – 70" },
};

/* ─────────────────────────────────────────────────────────────────────
   ALL CSS
───────────────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');

.nv-root {
  --g950:#08231A; --g800:#0F3D2A; --g700:#154C35; --g600:#1C6B45; --g100:#E4ECE3;
  --s50:#FAFAF8;  --s200:#ECEDE7; --s400:#C7CBC1;
  --ink:#16241C;  --cream:#F7F4EC; --gold:#C99A3D;
  --amber:#D97706; --red:#B3432B;

  --fd:'Fraunces',Georgia,serif;
  --fb:'Inter',-apple-system,sans-serif;
  --fm:'IBM Plex Mono','SFMono-Regular',monospace;

  width:100%; display:flex; justify-content:center;
  padding:28px 16px; background:var(--s50);
  font-family:var(--fb); box-sizing:border-box;
}
.nv-root *       { box-sizing:border-box; margin:0; padding:0; }
.nv-root button  { font-family:inherit; }
.nv-root :focus-visible { outline:2px solid var(--gold); outline-offset:2px; }

.nv-frame {
  width:min(100%,402px); min-height:800px; border-radius:30px;
  overflow:hidden; position:relative;
  box-shadow:0 30px 60px -20px rgba(8,35,26,.35),0 0 0 1px rgba(8,35,26,.06);
  background:var(--cream);
}
@media(max-width:480px){
  .nv-root{padding:0;}
  .nv-frame{border-radius:0;min-height:100vh;width:100%;box-shadow:none;}
}

.nv-screen{position:absolute;inset:0;display:flex;flex-direction:column;height:100%;animation:nv-in .38s ease both;}
@keyframes nv-in{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.nv-screen{animation:none}}
@keyframes nv-spin{to{transform:rotate(360deg)}}
@keyframes nv-pulse{0%,100%{opacity:1}50%{opacity:.45}}

/* brand mark */
.nv-bm{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:99px;background:var(--g800);color:var(--cream);font-family:var(--fd);font-weight:600;font-size:16px;flex-shrink:0;}

/* scroll body */
.nv-scroll{flex:1;overflow-y:auto;padding:10px 20px 90px;-webkit-overflow-scrolling:touch;}

/* ── SPLASH ── */
.nv-splash{background:linear-gradient(165deg,var(--g950),var(--g800));color:var(--cream);align-items:center;justify-content:center;cursor:pointer;padding:32px;text-align:center;}
.nv-splash svg.spr{width:96px;height:96px;margin-bottom:28px;}
.nv-splash svg.spr path{fill:none;stroke-linecap:round;stroke-linejoin:round;}
.nv-splash svg.spr .st{stroke:var(--gold);stroke-width:3;}
.nv-splash svg.spr .lf{stroke:var(--cream);stroke-width:3;}
.nv-splash svg.spr .mn{stroke:var(--cream);stroke-width:2;opacity:.3;}
@media(prefers-reduced-motion:no-preference){
  .nv-splash svg.spr path{stroke-dasharray:120;stroke-dashoffset:120;animation:nv-draw .9s ease forwards;}
  .nv-splash svg.spr .st {animation-delay:0s;}
  .nv-splash svg.spr .lfl{animation-delay:.55s;}
  .nv-splash svg.spr .lfr{animation-delay:.70s;}
  .nv-splash svg.spr .mn {animation-delay:0s;animation-duration:.6s;}
}
@keyframes nv-draw{to{stroke-dashoffset:0}}
.nv-splash h1{font-family:var(--fd);font-weight:600;font-size:40px;letter-spacing:-.01em;margin-bottom:8px;}
.nv-splash p{font-size:14.5px;color:rgba(247,244,236,.65);margin-bottom:56px;}
.spl-track{width:120px;height:3px;border-radius:2px;background:rgba(247,244,236,.15);overflow:hidden;}
.spl-fill{height:100%;width:0%;background:var(--gold);border-radius:2px;}
@media(prefers-reduced-motion:no-preference){.spl-fill{animation:nv-fill 2.2s linear forwards;}}
@media(prefers-reduced-motion:reduce){.spl-fill{width:100%;}}
@keyframes nv-fill{to{width:100%}}
.spl-hint{position:absolute;bottom:28px;font-size:12px;color:rgba(247,244,236,.4);letter-spacing:.02em;}

/* ── ONBOARDING ── */
.ob{background:var(--s50);}
.ob-top{display:flex;align-items:center;justify-content:space-between;padding:22px 22px 0;}
.ob-skip{background:none;border:none;color:var(--g600);font-size:14px;font-weight:500;cursor:pointer;padding:6px 4px;}
.ob-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 30px;}
.ob-slide{display:flex;flex-direction:column;align-items:center;}
@media(prefers-reduced-motion:no-preference){.ob-slide{animation:nv-in .4s ease both;}}
.ob-icon{width:68px;height:68px;border-radius:20px;background:var(--g100);color:var(--g800);display:flex;align-items:center;justify-content:center;margin-bottom:26px;}
.ob-ctr{font-family:var(--fm);font-size:12px;letter-spacing:.08em;color:var(--g600);margin-bottom:10px;}
.ob-title{font-family:var(--fd);font-weight:600;font-size:25px;color:var(--ink);margin-bottom:12px;}
.ob-text{font-size:15px;line-height:1.55;color:rgba(22,36,28,.6);max-width:270px;}
.dots{display:flex;gap:7px;margin-top:34px;}
.dot{height:7px;width:7px;border-radius:4px;background:var(--s400);border:none;padding:0;cursor:pointer;transition:width .25s,background .25s;}
.dot.on{width:22px;background:var(--g800);}
.ob-foot{display:flex;align-items:center;gap:12px;padding:18px 22px 30px;}
.prevbtn{width:48px;height:48px;border-radius:14px;border:1px solid var(--s400);background:var(--s50);color:var(--ink);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
.prevbtn:disabled{opacity:0;pointer-events:none;}

/* ── BUTTONS ── */
.btn{border:none;border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 20px;transition:opacity .15s,transform .1s;}
.btn:active{transform:scale(.98);}
.btn:disabled{opacity:.45;cursor:not-allowed;transform:none;}
.btn.p{background:var(--g800);color:var(--cream);width:100%;}
.btn.p:hover:not(:disabled){background:var(--g700);}
.btn.o{background:#fff;border:1px solid var(--s400);color:var(--ink);font-size:14px;font-weight:600;flex:1;padding:13px;}
.btn.danger{background:rgba(179,67,43,.1);color:var(--red);}

/* ── AUTH SHARED ── */
.auth-bg{background:var(--s50);}
.auth-hdr{background:linear-gradient(160deg,var(--g950),var(--g800));padding:22px 26px 56px;color:var(--cream);}
.auth-hdr h1{font-family:var(--fd);font-weight:600;font-size:26px;margin-bottom:6px;}
.auth-hdr p{font-size:14.5px;color:rgba(247,244,236,.68);}
.bk{width:36px;height:36px;border-radius:11px;background:rgba(247,244,236,.12);border:none;color:var(--cream);display:flex;align-items:center;justify-content:center;cursor:pointer;margin-bottom:26px;}
.bk.lt{background:var(--s200);color:var(--ink);margin-bottom:0;}
.sheet{background:#fff;border-radius:26px 26px 0 0;margin-top:-34px;flex:1;padding:28px 24px 26px;display:flex;flex-direction:column;overflow-y:auto;}
.seg{display:flex;background:var(--s200);border-radius:12px;padding:4px;margin-bottom:22px;}
.seg button{flex:1;border:none;background:transparent;padding:10px 0;border-radius:9px;font-size:13.5px;font-weight:600;color:rgba(22,36,28,.5);cursor:pointer;}
.seg button.on{background:var(--g800);color:var(--cream);}
.fld{margin-bottom:16px;}
.fld label{display:block;font-size:12.5px;font-weight:600;color:rgba(22,36,28,.5);margin-bottom:7px;letter-spacing:.01em;}
.iw{display:flex;align-items:center;gap:10px;background:var(--s50);border:1px solid var(--s400);border-radius:13px;padding:0 14px;}
.iw:focus-within{border-color:var(--g600);}
.iw svg{color:rgba(22,36,28,.4);flex-shrink:0;}
.iw input{flex:1;border:none;background:transparent;outline:none;padding:13px 0;font-size:15px;color:var(--ink);font-family:var(--fb);min-width:0;}
.eyebtn{background:none;border:none;color:rgba(22,36,28,.4);display:flex;cursor:pointer;padding:4px;}
.forgot{display:flex;justify-content:flex-end;margin:-2px 0 16px;}
.lnk{background:none;border:none;color:var(--g600);font-size:13px;font-weight:600;cursor:pointer;padding:4px 0;}
.note{background:var(--g100);color:var(--g800);font-size:12.5px;border-radius:10px;padding:9px 12px;margin-bottom:14px;animation:nv-in .3s ease both;}
.err{background:rgba(179,67,43,.09);color:var(--red);font-size:12.5px;border-radius:10px;padding:9px 12px;margin-bottom:14px;}
.ck-row{display:flex;align-items:flex-start;gap:9px;cursor:pointer;margin:6px 0 18px;}
.ck-row input{margin-top:3px;accent-color:var(--g800);width:16px;height:16px;flex-shrink:0;}
.ck-row span{font-size:12.5px;color:rgba(22,36,28,.6);line-height:1.4;}
.auth-foot{text-align:center;padding-top:16px;font-size:13.5px;color:rgba(22,36,28,.5);margin-top:auto;}
.auth-foot .lnk{font-size:13.5px;}

/* ── IN-APP CHROME ── */
.topbar{padding:20px 20px 6px;flex-shrink:0;}
.toprow{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--g600);margin-bottom:5px;}
.page-title{font-family:var(--fd);font-weight:600;font-size:24px;color:var(--ink);margin-bottom:3px;}
.page-sub{font-size:13.5px;color:rgba(22,36,28,.52);}
.hero-hdr{background:linear-gradient(160deg,var(--g950),var(--g700));padding:22px 20px 46px;color:var(--cream);flex-shrink:0;}
.lifted{background:var(--s50);border-radius:24px 24px 0 0;margin-top:-20px;flex:1;overflow-y:auto;padding:22px 20px 90px;}
.sec-lbl{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(22,36,28,.42);margin:18px 0 10px;}
.divider{height:1px;background:rgba(22,36,28,.07);margin:14px 0;}

/* cards */
.card{background:#fff;border:1px solid var(--s200);border-radius:18px;padding:16px;margin-bottom:14px;cursor:pointer;width:100%;text-align:left;font-family:inherit;display:block;transition:transform .12s,box-shadow .12s;}
.card:hover{box-shadow:0 6px 18px -10px rgba(8,35,26,.18);}
.card:active{transform:scale(.99);}

/* pill / badge */
.pill{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:999px;font-size:12px;font-weight:600;flex-shrink:0;}
.pill.gr{background:var(--g100);color:var(--g800);}
.pill.am{background:rgba(217,119,6,.1);color:var(--amber);}
.pill.re{background:rgba(179,67,43,.1);color:var(--red);}
.pill.gy{background:var(--s200);color:rgba(22,36,28,.55);}

/* icon box */
.ib{display:flex;align-items:center;justify-content:center;border-radius:13px;flex-shrink:0;}
.ib.md{width:46px;height:46px;}
.ib.lg{width:54px;height:54px;border-radius:16px;}
.ib.gr{background:var(--g100);color:var(--g800);}
.ib.wh{background:#fff;color:var(--g800);}
.ib.am{background:rgba(217,119,6,.1);color:var(--amber);}
.ib.re{background:rgba(179,67,43,.1);color:var(--red);}

/* status dot */
.sdot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
.sdot.gr{background:var(--g600);}
.sdot.am{background:var(--amber);}
.sdot.re{background:var(--red);}

/* ── DASHBOARD ── */
.dash{background:var(--s50);}
.dash-top{padding:22px 20px 4px;display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;}
.greet-sub{font-size:13px;color:rgba(22,36,28,.48);margin-bottom:2px;}
.greet-name{font-family:var(--fd);font-weight:600;font-size:22px;color:var(--ink);}
.hdr-icons{display:flex;gap:10px;}
.icon-btn{width:40px;height:40px;border-radius:12px;background:var(--s200);border:none;color:var(--ink);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;}
.badge{position:absolute;top:8px;right:8px;width:7px;height:7px;border-radius:50%;background:var(--gold);}
.dash-scroll{flex:1;overflow-y:auto;padding:14px 20px 130px;}
.wx-card{background:linear-gradient(135deg,var(--g800),var(--g600));color:var(--cream);display:flex;align-items:center;gap:14px;border:none;}
.wx-temp{font-family:var(--fd);font-size:28px;font-weight:600;}
.wx-sub{font-size:12.5px;color:rgba(247,244,236,.72);margin-top:3px;}
.ai-card{display:flex;align-items:center;gap:13px;background:var(--g100);border:none;}
.ai-title{font-weight:600;font-size:14.5px;color:var(--g800);margin-bottom:3px;}
.ai-sub{font-size:12.5px;color:rgba(15,61,42,.65);}
.fab{position:absolute;right:18px;bottom:80px;width:54px;height:54px;border-radius:50%;background:var(--g800);color:var(--cream);border:none;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px -8px rgba(8,35,26,.55);cursor:pointer;z-index:6;}
.tabbar{position:absolute;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--s200);display:flex;padding:10px 6px 14px;z-index:5;}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:none;color:rgba(22,36,28,.4);font-size:11px;font-weight:600;cursor:pointer;padding:4px 0;}
.tab.on{color:var(--g800);}

/* ── QA ── */
.qa-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;padding:10px 20px 30px;flex:1;overflow-y:auto;align-content:start;}
.qa-tile{aspect-ratio:1;background:#fff;border:1px solid var(--s200);border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;text-align:center;padding:10px;font-family:inherit;}
.qa-tile:active{transform:scale(.97);}
.qa-label{font-size:13px;font-weight:600;color:var(--ink);line-height:1.3;}

/* ── FIELD ── */
.stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;}
.stat-tile{background:#fff;border:1px solid var(--s200);border-radius:14px;padding:12px 10px;text-align:center;}
.stat-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:rgba(22,36,28,.42);margin-bottom:6px;}
.stat-val{font-family:var(--fm);font-size:16px;font-weight:500;color:var(--ink);}
.stat-unit{font-size:10px;color:rgba(22,36,28,.38);}

/* ── WEATHER ── */
.wx-hero{background:linear-gradient(175deg,var(--g950),var(--g700));padding:22px 20px 40px;color:var(--cream);flex-shrink:0;}
.wx-big{font-family:var(--fd);font-size:64px;font-weight:600;line-height:1;}
.wx-desc{font-size:16px;color:rgba(247,244,236,.75);margin-top:8px;}
.wx-loc{display:flex;align-items:center;gap:5px;font-size:12.5px;color:rgba(247,244,236,.55);margin-top:6px;}
.wx-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:24px;}
.wx-meta-tile{background:rgba(247,244,236,.08);border-radius:14px;padding:12px 10px;text-align:center;}
.wx-meta-val{font-family:var(--fm);font-size:17px;font-weight:500;color:var(--cream);}
.wx-meta-key{font-size:11px;color:rgba(247,244,236,.5);margin-top:4px;}
.fc-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;}
.fc-day{font-size:14px;font-weight:600;color:var(--ink);min-width:54px;}
.fc-rng{font-family:var(--fm);font-size:13.5px;color:var(--ink);}
.fc-rng span{color:rgba(22,36,28,.4);}
.alert-strip{display:flex;align-items:flex-start;gap:10px;background:rgba(217,119,6,.09);border-radius:14px;padding:13px;margin-bottom:14px;}
.alert-strip h4{font-size:14px;font-weight:600;color:var(--amber);margin-bottom:3px;}
.alert-strip p{font-size:12.5px;color:rgba(22,36,28,.6);line-height:1.4;}

/* ── SOIL MONITORING ── */
.soil-hero{background:linear-gradient(160deg,var(--g950),var(--g800));padding:22px 20px 36px;color:var(--cream);flex-shrink:0;}
.soil-hero-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;}
.soil-big-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.soil-big-tile{background:rgba(247,244,236,.09);border-radius:16px;padding:14px 12px;}
.soil-big-key{font-size:11px;color:rgba(247,244,236,.5);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;}
.soil-big-val{font-family:var(--fd);font-size:26px;font-weight:600;color:var(--cream);}
.soil-big-unit{font-size:13px;color:rgba(247,244,236,.55);}
.soil-big-bar{height:4px;border-radius:2px;background:rgba(247,244,236,.15);margin-top:8px;overflow:hidden;}
.soil-big-fill{height:100%;border-radius:2px;background:var(--gold);}
.log-row{display:flex;align-items:center;gap:12px;padding:12px 0;}
.log-body{flex:1;}
.log-title{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:2px;}
.log-sub{font-size:12.5px;color:rgba(22,36,28,.5);}
.log-val{font-family:var(--fm);font-size:14.5px;font-weight:500;color:var(--ink);}

/* slider */
.slider-row{margin-bottom:18px;}
.slider-row label{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;font-weight:600;color:var(--ink);margin-bottom:8px;}
.slider-row label span{font-family:var(--fm);font-size:13px;color:var(--g600);}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:3px;background:var(--s200);outline:none;}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--g800);cursor:pointer;border:2px solid #fff;box-shadow:0 2px 6px rgba(8,35,26,.25);}
input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:var(--g800);cursor:pointer;border:2px solid #fff;}
.ideal-tag{font-size:11px;color:rgba(22,36,28,.42);margin-top:5px;}

/* ── AI RECOMMENDATION ── */
.ai-screen{background:var(--s50);}
.ai-hero{background:linear-gradient(160deg,var(--g950),var(--g700));padding:22px 20px 48px;color:var(--cream);flex-shrink:0;}
.ai-hero-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;}
.ai-spinner-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;}
.ai-spinner-ring{width:56px;height:56px;border-radius:50%;border:3px solid var(--g100);border-top-color:var(--g800);animation:nv-spin .9s linear infinite;margin-bottom:18px;}
.ai-spinner-text{font-size:14px;color:rgba(22,36,28,.5);text-align:center;line-height:1.5;}
.ai-result-hero{background:linear-gradient(135deg,var(--g800),var(--g600));border-radius:20px;padding:20px;color:var(--cream);margin-bottom:14px;}
.ai-crop-big{font-family:var(--fd);font-size:32px;font-weight:600;margin-bottom:4px;}
.ai-crop-conf{font-size:13px;color:rgba(247,244,236,.65);}
.conf-bar-wrap{height:6px;background:rgba(247,244,236,.2);border-radius:3px;margin-top:12px;overflow:hidden;}
.conf-bar-fill{height:100%;border-radius:3px;background:var(--gold);}
.alt-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;}
.alt-name{font-size:14px;font-weight:600;color:var(--ink);}
.alt-conf{font-family:var(--fm);font-size:12.5px;color:rgba(22,36,28,.5);}
.alt-bar-wrap{flex:1;height:4px;background:var(--s200);border-radius:2px;margin:0 12px;overflow:hidden;}
.alt-bar-fill{height:100%;border-radius:2px;background:var(--g600);}
.fert-card{border-radius:16px;padding:16px;margin-bottom:14px;}
.fert-class-1{background:rgba(201,154,61,.1);border:1px solid rgba(201,154,61,.25);}
.fert-class-2{background:rgba(15,61,42,.08);border:1px solid rgba(15,61,42,.18);}
.fert-class-3{background:rgba(37,99,235,.08);border:1px solid rgba(37,99,235,.18);}
.advice-row{display:flex;align-items:flex-start;gap:10px;padding:10px 0;}
.advice-icon{width:32px;height:32px;border-radius:10px;background:var(--g100);color:var(--g800);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
.advice-body p{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:3px;}
.advice-body span{font-size:12.5px;color:rgba(22,36,28,.55);line-height:1.4;}
.ai-error{background:rgba(179,67,43,.07);border:1px solid rgba(179,67,43,.18);border-radius:16px;padding:20px;text-align:center;}
.ai-error p{font-size:14px;color:var(--red);line-height:1.5;}

/* ── PROFILE ── */
.prof-hero{background:linear-gradient(160deg,var(--g950),var(--g800));padding:28px 20px 58px;color:var(--cream);text-align:center;flex-shrink:0;position:relative;}
.avatar{width:80px;height:80px;border-radius:50%;background:rgba(247,244,236,.15);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;position:relative;}
.avatar-edit{position:absolute;bottom:-2px;right:-2px;width:26px;height:26px;border-radius:50%;background:var(--gold);color:#fff;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.prof-name{font-family:var(--fd);font-weight:600;font-size:22px;margin-bottom:4px;}
.prof-role">Small-scale farmer · Kaduna, Nigeria</p>
</div>
.prof-lifted{background:var(--s50);border-radius:24px 24px 0 0;margin-top:-20px;flex:1;overflow-y:auto;padding:24px 20px 90px;}
.prof-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:var(--s200);border-radius:14px;overflow:hidden;margin-bottom:20px;}
.prof-stat{background:#fff;padding:14px 10px;text-align:center;}
.prof-stat-val{font-family:var(--fm);font-size:20px;font-weight:500;color:var(--ink);margin-bottom:3px;}
.prof-stat-key{font-size:11px;color:rgba(22,36,28,.45);}
.menu-row{display:flex;align-items:center;gap:13px;padding:14px 0;cursor:pointer;background:none;border:none;width:100%;font-family:inherit;text-align:left;}
.menu-lbl{flex:1;font-size:15px;font-weight:500;color:var(--ink);}
.menu-sub{font-size:12.5px;color:rgba(22,36,28,.45);margin-top:1px;}

/* ── ALERTS ── */
.alert-item{display:flex;align-items:flex-start;gap:13px;padding:14px 0;}
.alert-body{flex:1;}
.alert-title{font-size:14.5px;font-weight:600;color:var(--ink);margin-bottom:3px;}
.alert-meta{font-size:12px;color:rgba(22,36,28,.45);}
.alert-desc{font-size:13px;color:rgba(22,36,28,.6);margin-top:4px;line-height:1.4;}
.unread-dot{width:8px;height:8px;border-radius:50%;background:var(--g600);flex-shrink:0;margin-top:6px;}
.filter-row{display:flex;gap:8px;margin-bottom:6px;overflow-x:auto;padding-bottom:2px;}
.filter-row::-webkit-scrollbar{display:none;}
.chip{border:1px solid var(--s400);background:#fff;color:rgba(22,36,28,.55);font-size:13px;font-weight:600;padding:7px 14px;border-radius999px;cursor:pointer;white-space:nowrap;flex-shrink:0;}
.chip.on{background:var(--g800);color:var(--cream);border-color:var(--g800);}

/* ── FARM MGMT ── */
.fm-name{font-weight:600;font-size:15.5px;color:var(--ink);margin-bottom:3px;}
.fm-meta{font-size:13px;color:rgba(22,36,28,.5);}
.fm-btns{display:flex;gap:10px;}
.fm-btn{width:36px;height:36px;border-radius:11px;border:1px solid var(--s200);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(22,36,28,.5);}
.fm-btn:hover{color:var(--g800);}
.fm-btn.del:hover{color:var(--red);}
.sum-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.sum-tile{background:#fff;border:1px solid var(--s200);border-radius:16px;padding:14px;}
.sum-val{font-family:var(--fd);font-size:22px;font-weight:600;color:var(--ink);margin-bottom:3px;}
.sum-key{font-size:12px;color:rgba(22,36,28,.45);}
.sum-sub{font-size:12px;color:var(--g600);font-weight:600;margin-top:4px;}

/* ── TOAST ── */
.toast-wrap{position:absolute;left:0;right:0;bottom:26px;display:flex;justify-content:center;z-index:50;pointer-events:none;padding:0 24px;}
.toast{background:var(--g950);color:var(--cream);font-size:13px;font-weight:500;padding:11px 18px;border-radius:999px;box-shadow:0 14px 30px -10px rgba(8,35,26,.5);animation:nv-in .25s ease both;max-width:100%;text-align:center;}
`;

/* ─────────────────────────────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────────────────────────────── */
function BrandMark() { return <span className="nv-bm">N</span>; }

function TopBar({ title, sub, eyebrow, onBack, right }) {
  return (
    <div className="topbar">
      <div className="toprow">
        <button className="bk lt" onClick={onBack} aria-label="Back"><ChevronLeft size={18}/></button>
        {right || <span/>}
      </div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1>
      {sub && <p className="page-sub">{sub}</p>}
    </div>
  );
}

function TabBar({ active, onHome, onFields, onAlerts, onProfile }) {
  return (
    <div className="tabbar">
      {[{id:"home",Icon:Home,label:"Home",cb:onHome},{id:"fields",Icon:Sprout,label:"Fields",cb:onFields},
        {id:"alerts",Icon:Bell,label:"Alerts",cb:onAlerts},{id:"profile",Icon:User,label:"Profile",cb:onProfile}
      ].map(({id,Icon,label,cb})=>(
        <button key={id} className={`tab${active===id?" on":""}`} onClick={cb}>
          <Icon size={19}/><span>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 1 — SPLASH
───────────────────────────────────────────────────────────────────── */
function SplashScreen({ onDone }) {
  const t = useRef();
  useEffect(()=>{
    const rm = window.matchMedia?.("(prefers-reduced-motion:reduce)").matches;
    t.current = setTimeout(onDone, rm?700:2300);
    return ()=>clearTimeout(t.current);
  },[onDone]);
  const skip=()=>{clearTimeout(t.current);onDone();};
  return (
    <div className="nv-screen nv-splash" onClick={skip} role="button" tabIndex={0} onKeyDown={e=>e.key==="Enter"&&skip()}>
      <svg className="spr" viewBox="0 0 100 100">
        <path className="mn" d="M20 78 Q50 70 80 78"/>
        <path className="st"  d="M50 78 L50 38"/>
        <path className="lf lfl" d="M50 52 C36 50 28 40 26 26 C42 28 50 36 50 52 Z"/>
        <path className="lf lfr" d="M50 44 C64 42 72 32 74 18 C58 20 50 28 50 44 Z"/>
      </svg>
      <h1>Novyra</h1>
      <p>Smart farming, rooted in data.</p>
      <div className="spl-track"><div className="spl-fill"/></div>
      <span className="spl-hint">Tap to continue</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 2 — ONBOARDING
───────────────────────────────────────────────────────────────────── */
const SLIDES=[
  {Icon:Droplets,title:"Know your soil",text:"Adjust and monitor pH, N, P, K and moisture readings from your field sensors in real time."},
  {Icon:Sprout,  title:"Plant with confidence",text:"AI-powered crop and fertiliser recommendations matched exactly to your soil readings."},
  {Icon:CloudSun,title:"Stay ahead of the weather",text:"Local forecasts and timely alerts so you're never caught off guard at harvest."},
];
function OnboardingScreen({onDone}){
  const [i,setI]=useState(0); const s=SLIDES[i]; const last=i===SLIDES.length-1;
  return(
    <div className="nv-screen ob">
      <div className="ob-top"><BrandMark/><button className="ob-skip" onClick={onDone}>Skip</button></div>
      <div className="ob-body">
        <div className="ob-slide" key={i}>
          <div className="ob-icon"><s.Icon size={30} strokeWidth={1.8}/></div>
          <span className="ob-ctr">{String(i+1).padStart(2,"0")} / {String(SLIDES.length).padStart(2,"0")}</span>
          <h2 className="ob-title">{s.title}</h2>
          <p className="ob-text">{s.text}</p>
        </div>
        <div className="dots">{SLIDES.map((_,j)=><button key={j} className={`dot${j===i?" on":""}`} onClick={()=>setI(j)} aria-label={`Slide ${j+1}`}/>)}</div>
      </div>
      <div className="ob-foot">
        <button className="prevbtn" onClick={()=>setI(p=>Math.max(0,p-1))} disabled={i===0}><ChevronLeft size={20}/></button>
        <button className="btn p" onClick={()=>last?onDone():setI(p=>p+1)}>{last?"Get started":"Next"}<ArrowRight size={17}/></button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 3 — AUTH
───────────────────────────────────────────────────────────────────── */
function AuthScreen({onBack,onRegister,onDone}){
  const [m,setM]=useState("email"),[id,setId]=useState(""),[pw,setPw]=useState(""),[show,setShow]=useState(false),[busy,setBusy]=useState(false);
  const sub=e=>{
    if(e&&e.preventDefault)e.preventDefault();
    if(busy)return;
    if(!id.trim()||!pw.trim())return;
    setBusy(true);setTimeout(onDone,900);
  };
  return(
    <div className="nv-screen auth-bg">
      <div className="auth-hdr"><button className="bk" onClick={onBack}><ChevronLeft size={18}/></button><h1>Welcome back</h1><p>Log in to manage your farm.</p></div>
      <div className="sheet">
        <div>
          <div className="seg">
            <button type="button" className={m==="email"?"on":""} onClick={()=>setM("email")}>Email</button>
            <button type="button" className={m==="phone"?"on":""} onClick={()=>setM("phone")}>Phone number</button>
          </div>
          <div className="fld"><label>{m==="email"?"Email":"Phone number"}</label>
            <div className="iw">{m==="email"?<Mail size={17}/>:<Phone size={17}/>}
              <input type={m==="email"?"email":"tel"} placeholder={m==="email"?"you@farm.com":"+234 80 0000 0000"} value={id} onChange={e=>setId(e.target.value)} autoComplete={m} onKeyDown={e=>{if(e.key==="Enter")sub(e);}}/>
            </div></div>
          <div className="fld"><label>Password</label>
            <div className="iw"><Lock size={17}/>
              <input type={show?"text":"password"} placeholder="Enter your password" value={pw} onChange={e=>setPw(e.target.value)} autoComplete="current-password" onKeyDown={e=>{if(e.key==="Enter")sub(e);}}/>
              <button type="button" className="eyebtn" onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button>
            </div></div>
          <div className="forgot"><button type="button" className="lnk">Forgot password?</button></div>
          <button className="btn p" type="button" disabled={busy} onClick={sub}>
            {busy?<><Loader2 size={17} style={{animation:"nv-spin .7s linear infinite"}}/>Logging in…</>:"Log in"}
          </button>
          <div className="auth-foot">New to Novyra? <button type="button" className="lnk" onClick={onRegister}>Create account</button></div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 4 — REGISTRATION
───────────────────────────────────────────────────────────────────── */
function RegScreen({onLogin,onDone}){
  const [nm,setNm]=useState(""),[ph,setPh]=useState(""),[fl,setFl]=useState(""),[pw,setPw]=useState(""),[cpw,setCpw]=useState("");
  const [show,setShow]=useState(false),[ag,setAg]=useState(false),[busy,setBusy]=useState(false),[err,setErr]=useState(null);
  const sub=e=>{
    if(e&&e.preventDefault)e.preventDefault();
    if(busy)return;
    if(!nm.trim()){setErr("Enter your full name.");return;}
    if(!ph.trim()){setErr("Enter your phone number.");return;}
    if(!fl.trim()){setErr("Name your first field.");return;}
    if(!pw.trim()){setErr("Create a password.");return;}
    if(!cpw.trim()){setErr("Confirm your password.");return;}
    if(pw!==cpw){setErr("Passwords don't match.");return;}
    if(!ag){setErr("Please agree to the Terms of Service and Privacy Policy to continue.");return;}
    setErr(null);setBusy(true);
    onDone(nm.trim(),fl.trim());
  };
  return(
    <div className="nv-screen auth-bg">
      <div className="auth-hdr"><button className="bk" onClick={onLogin}><ChevronLeft size={18}/></button><h1>Create your account</h1><p>Set up Novyra in a couple of minutes.</p></div>
      <div className="sheet">
        <div>
          {[{id:"nm",label:"Full name",Icon:User,type:"text",ph:"Adaeze Okonkwo",val:nm,set:setNm,ac:"name"},
            {id:"ph",label:"Phone number",Icon:Phone,type:"tel",ph:"+234 80 0000 0000",val:ph,set:setPh,ac:"tel"},
            {id:"fl",label:"Your first field",Icon:Sprout,type:"text",ph:"e.g. North Plot",val:fl,set:setFl,ac:"off"},
          ].map(({id,label,Icon,type,ph,val,set,ac})=>(
            <div className="fld" key={id}><label htmlFor={id}>{label}</label>
              <div className="iw"><Icon size={17}/><input id={id} type={type} placeholder={ph} value={val} onChange={e=>set(e.target.value)} autoComplete={ac} onKeyDown={e=>{if(e.key==="Enter")sub(e);}}/></div>
            </div>
          ))}
          <div className="fld"><label>Password</label>
            <div className="iw"><Lock size={17}/>
              <input type={show?"text":"password"} placeholder="Create a password" value={pw} onChange={e=>setPw(e.target.value)} autoComplete="new-password" onKeyDown={e=>{if(e.key==="Enter")sub(e);}}/>
              <button type="button" className="eyebtn" onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button>
            </div></div>
          <div className="fld"><label>Confirm password</label>
            <div className="iw"><Lock size={17}/>
              <input type={show?"text":"password"} placeholder="Re-enter your password" value={cpw} onChange={e=>setCpw(e.target.value)} autoComplete="new-password" onKeyDown={e=>{if(e.key==="Enter")sub(e);}}/>
            </div></div>
          {err&&<div className="err">{err}</div>}
          <label className="ck-row"><input type="checkbox" checked={ag} onChange={e=>setAg(e.target.checked)}/><span>I agree to Novyra's Terms of Service and Privacy Policy.</span></label>
          <button className="btn p" type="button" disabled={busy} onClick={sub}>
            {busy?<><Loader2 size={17} style={{animation:"nv-spin .7s linear infinite"}}/>Creating account…</>:"Create account"}
          </button>
          <div className="auth-foot">Already have an account? <button type="button" className="lnk" onClick={onLogin}>Log in</button></div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 5 — DASHBOARD
───────────────────────────────────────────────────────────────────── */
function greet(){const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening";}
function DashboardScreen({userName,fieldName,sensors,nav}){
  const first=userName?.trim().split(" ")[0]||"";
  const topCrop = sensors._lastResult?.crop || "Maize";
  const topConf = sensors._lastResult?.cropConf || 91;
  return(
    <div className="nv-screen dash">
      <div className="dash-top">
        <div><p className="greet-sub">{greet()}{first?",":""}</p><h1 className="greet-name">{first||"Welcome back"}</h1></div>
        <div className="hdr-icons">
          <button className="icon-btn" onClick={()=>nav("alerts")}><Bell size={18}/><span className="badge"/></button>
          <button className="icon-btn" onClick={()=>nav("profile")}><User size={18}/></button>
        </div>
      </div>
      <div className="dash-scroll">
        <button className="card wx-card" onClick={()=>nav("weather")}>
          <CloudSun size={36} strokeWidth={1.5}/>
          <div><p className="wx-temp">{sensors.temperature}°C</p><p className="wx-sub">Partly cloudy · good day for fieldwork</p></div>
        </button>
        <p className="sec-lbl">Your field</p>
        <button className="card" style={{display:"flex",alignItems:"center",gap:13}} onClick={()=>nav("field")}>
          <div className="ib md gr"><Sprout size={22} strokeWidth={1.8}/></div>
          <div style={{flex:1}}><p style={{fontWeight:600,fontSize:15.5,color:"var(--ink)",marginBottom:3}}>{fieldName||"Your field"}</p><p style={{fontSize:13,color:"rgba(22,36,28,.5)"}}>Maize · 2.4 ha</p></div>
          <span className="sdot gr"/>
        </button>
        <button className="card" style={{border:"1.5px dashed var(--s400)",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:14,fontWeight:600,color:"rgba(22,36,28,.5)"}} onClick={()=>nav("farmmanagement")}>
          <Plus size={16}/>Add another field
        </button>
        <p className="sec-lbl">AI insight</p>
        <button className="card ai-card" onClick={()=>nav("ai")}>
          <div className="ib md wh"><Sparkles size={20} strokeWidth={1.8}/></div>
          <div><p className="ai-title">{topCrop} is your best match</p><p className="ai-sub">{topConf}% confidence · tap to run analysis</p></div>
        </button>
      </div>
      <button className="fab" onClick={()=>nav("quickactions")}><Zap size={22}/></button>
      <TabBar active="home" onHome={()=>nav("dashboard")} onFields={()=>nav("field")} onAlerts={()=>nav("alerts")} onProfile={()=>nav("profile")}/>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 6 — QUICK ACTIONS
───────────────────────────────────────────────────────────────────── */
const QA=[
  {Icon:MapPin,   label:"View field details",   to:"field"},
  {Icon:Plus,     label:"Add a field",           to:"farmmanagement"},
  {Icon:Sparkles, label:"Run AI recommendation", to:"ai"},
  {Icon:Droplets, label:"Log a soil reading",    to:"soil"},
  {Icon:CloudSun, label:"Check the weather",     to:"weather"},
  {Icon:Bell,     label:"View alerts",           to:"alerts"},
];
function QuickActionsScreen({nav}){
  return(
    <div className="nv-screen" style={{background:"var(--s50)"}}>
      <TopBar title="Quick actions" sub="Jump straight to what you need." onBack={()=>nav("dashboard")}/>
      <div className="qa-grid">
        {QA.map(({Icon,label,to})=>(
          <button key={label} className="qa-tile" onClick={()=>nav(to)}>
            <div className="ib md gr"><Icon size={22} strokeWidth={1.8}/></div>
            <span className="qa-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 7 — FIELD DETAILS
───────────────────────────────────────────────────────────────────── */
function FieldScreen({fieldName,sensors,nav}){
  const keys=["pH","N","P","K","moisture","temperature"];
  const labels={pH:"pH",N:"Nitrogen",P:"Phosphorus",K:"Potassium",moisture:"Moisture",temperature:"Temp"};
  const units={pH:"",N:"mg/kg",P:"mg/kg",K:"mg/kg",moisture:"%",temperature:"°C"};
  const topCrop=sensors._lastResult?.crop||"Maize";
  const topConf=sensors._lastResult?.cropConf||91;
  const fertDesc=sensors._lastResult?.fertDesc||"Low phosphorus — apply a phosphorus-rich fertiliser";
  const fertConf=sensors._lastResult?.fertConf||84;
  return(
    <div className="nv-screen" style={{background:"var(--s50)"}}>
      <TopBar eyebrow="Field details" title={fieldName||"Your field"} sub="2.4 ha · Kaduna, Nigeria" onBack={()=>nav("dashboard")}
        right={<span className="pill gr"><Check size={13}/>Healthy</span>}/>
      <div className="nv-scroll">
        <button className="card" style={{display:"flex",alignItems:"center",gap:13}} onClick={()=>nav("farmmanagement")}>
          <div className="ib md gr"><Sprout size={22} strokeWidth={1.8}/></div>
          <div style={{flex:1}}><p style={{fontWeight:600,fontSize:15.5,color:"var(--ink)",marginBottom:3}}>Maize</p><p style={{fontSize:13,color:"rgba(22,36,28,.5)"}}>Planted 14 Apr · ~68 days to harvest</p></div>
          <ChevronRight size={18} style={{color:"rgba(22,36,28,.3)"}}/>
        </button>
        <p className="sec-lbl">Soil snapshot · live readings</p>
        <div className="stat-grid">
          {keys.map(k=>(
            <div className="stat-tile" key={k}>
              <p className="stat-lbl">{labels[k]}</p>
              <p className="stat-val">{sensors[k]}<span className="stat-unit"> {units[k]}</span></p>
            </div>
          ))}
        </div>
        <button className="card" style={{background:"var(--g100)",border:"none"} } onClick={()=>nav("ai")}>
          <p className="sec-lbl" style={{marginTop:0,color:"var(--g800)"}}>AI recommendation</p>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:"rgba(15,61,42,.6)"}}>Recommended crop</span>
            <span style={{fontFamily:"var(--fm)",fontSize:11,color:"rgba(15,61,42,.5)"}}>{topConf}% conf.</span>
          </div>
          <p style={{fontSize:14,fontWeight:600,color:"var(--g800)",marginBottom:10}}>{topCrop}</p>
          <div className="divider"/>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:"rgba(15,61,42,.6)"}}>Soil status</span>
            <span style={{fontFamily:"var(--fm)",fontSize:11,color:"rgba(15,61,42,.5)"}}>{fertConf}% conf.</span>
          </div>
          <p style={{fontSize:14,fontWeight:600,color:"var(--g800)",marginBottom:8}}>{fertDesc}</p>
          <button type="button" className="lnk" onClick={e=>{e.stopPropagation();nav("ai");}}>View full recommendation →</button>
        </button>
        <button className="card" style={{display:"flex",alignItems:"center",gap:13}} onClick={()=>nav("weather")}>
          <CloudSun size={26} strokeWidth={1.7} style={{color:"var(--g700)",flexShrink:0}}/>
          <div style={{flex:1}}><p style={{fontWeight:600,fontSize:14.5,color:"var(--ink)",marginBottom:3}}>{sensors.temperature}°C · Partly cloudy</p><p style={{fontSize:13,color:"rgba(22,36,28,.5)"}}>Good conditions for fieldwork today</p></div>
          <ChevronRight size={18} style={{color:"rgba(22,36,28,.3)"}}/>
        </button>
        <div style={{display:"flex",gap:12,marginTop:6}}>
          <button className="btn o" onClick={()=>nav("soil")}>Log new reading</button>
          <button className="btn o" onClick={()=>nav("farmmanagement")}>Edit field</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 8 — WEATHER
───────────────────────────────────────────────────────────────────── */
const FC=[
  {day:"Today",Icon:CloudSun,lo:24,hi:33},{day:"Tue",Icon:Sun,lo:23,hi:35},
  {day:"Wed",Icon:Cloud,lo:22,hi:30},{day:"Thu",Icon:CloudRain,lo:20,hi:27},
  {day:"Fri",Icon:CloudRain,lo:19,hi:25},{day:"Sat",Icon:CloudLightning,lo:18,hi:24},{day:"Sun",Icon:Sun,lo:21,hi:32},
];
function WeatherScreen({fieldName,sensors,nav}){
  return(
    <div className="nv-screen" style={{background:"var(--s50)"}}>
      <div className="wx-hero">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:26}}>
          <button className="bk" onClick={()=>nav("dashboard")}><ChevronLeft size={18}/></button>
          <span className="pill" style={{background:"rgba(247,244,236,.12)",color:"rgba(247,244,236,.8)"}}><MapPin size={12}/>{fieldName||"Your field"}</span>
        </div>
        <p className="wx-big">{sensors.temperature}°</p>
        <p className="wx-desc">Partly cloudy</p>
        <div className="wx-loc"><MapPin size={12}/>Kaduna, Nigeria</div>
        <div className="wx-meta">
          <div className="wx-meta-tile"><p className="wx-meta-val">{sensors.humidity}%</p><p className="wx-meta-key">Humidity</p></div>
          <div className="wx-meta-tile"><p className="wx-meta-val">14</p><p className="wx-meta-key">Wind km/h</p></div>
          <div className="wx-meta-tile"><p className="wx-meta-val">{sensors.pressure}</p><p className="wx-meta-key">hPa</p></div>
        </div>
      </div>
      <div className="lifted">
        <div className="alert-strip">
          <AlertTriangle size={18} style={{color:"var(--amber)",flexShrink:0,marginTop:2}}/>
          <div><h4>Rain expected Thursday</h4><p>Postpone fertiliser application by at least 48 hours to avoid runoff.</p></div>
        </div>
        <p className="sec-lbl">7-day forecast</p>
        {FC.map(({day,Icon,lo,hi},i)=>(
          <React.Fragment key={day}>
            <div className="fc-row">
              <span className="fc-day">{day}</span>
              <Icon size={20} style={{color:"var(--g600)"}}/>
              <span className="fc-rng"><span>{lo}°  </span>{hi}°</span>
            </div>
            {i<FC.length-1&&<div className="divider"/>}
          </React.Fragment>
        ))}
        <p className="sec-lbl" style={{marginTop:20}}>Farm conditions</p>
        {[
          {label:"Evapotranspiration",val:"4.2 mm/day",note:"Moderate water stress — consider irrigation"},
          {label:"UV index",val:"8 (Very high)",note:"Limit outdoor work 12:00–15:00"},
          {label:"Soil temp (est.)",val:`${sensors.temperature-1}°C`,note:"Ideal germination range for maize"},
        ].map(r=>(
          <div className="card" key={r.label} style={{cursor:"default"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
              <div><p style={{fontWeight:600,fontSize:14,color:"var(--ink)",marginBottom:4}}>{r.label}</p><p style={{fontSize:12.5,color:"rgba(22,36,28,.55)",lineHeight:1.45}}>{r.note}</p></div>
              <span style={{fontFamily:"var(--fm)",fontSize:13,color:"var(--g800)",whiteSpace:"nowrap"}}>{r.val}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 9 — SOIL MONITORING  (now with live editable sliders)
───────────────────────────────────────────────────────────────────── */
const SOIL_KEYS=["pH","N","P","K"];
const SOIL_LOG=[
  {date:"Today, 09:14",field:"North Plot",val:"pH 6.4  N 78  P 42  K 95"},
  {date:"Yesterday 16:30",field:"North Plot",val:"pH 6.2  N 74  P 40  K 91"},
  {date:"28 Jun, 08:55",field:"North Plot",val:"pH 6.5  N 80  P 44  K 98"},
];

function SoilScreen({fieldName,sensors,setSensors,nav}){
  const [tab,setTab]=useState("readings");
  const [edit,setEdit]=useState(false);
  const pct=(k)=>{
    const {min,max}=SENSOR_META[k];
    return Math.round(((sensors[k]-min)/(max-min))*100);
  };
  const TrendIcon=({k})=>{
    const p=pct(k);
    if(p>65) return <TrendingUp size={16} style={{color:"var(--g600)"}}/>;
    if(p<35) return <TrendingDown size={16} style={{color:"var(--red)"}}/>;
    return <Minus size={16} style={{color:"rgba(22,36,28,.38)"}}/>;
  };
  return(
    <div className="nv-screen" style={{background:"var(--s50)"}}>
      <div className="soil-hero">
        <div className="soil-hero-top">
          <button className="bk" onClick={()=>nav("field")}><ChevronLeft size={18}/></button>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span className="pill" style={{background:"rgba(247,244,236,.12)",color:"rgba(247,244,236,.8)"}}>{fieldName||"North Plot"}</span>
            <button style={{background:"rgba(247,244,236,.12)",border:"none",color:"rgba(247,244,236,.8)",borderRadius:10,padding:"6px 10px",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}} onClick={()=>setEdit(v=>!v)}>
              <SlidersHorizontal size={13}/>{edit?"Done":"Edit"}
            </button>
          </div>
        </div>
        <p style={{color:"rgba(247,244,236,.6)",fontSize:12,marginBottom:12,fontFamily:"var(--fm)",letterSpacing:".06em",textTransform:"uppercase"}}>Live soil readings</p>
        <div className="soil-big-grid">
          {SOIL_KEYS.map(k=>(
            <div className="soil-big-tile" key={k}>
              <p className="soil-big-key">{SENSOR_META[k].label}</p>
              <p className="soil-big-val">{sensors[k]}<span className="soil-big-unit"> {SENSOR_META[k].unit}</span></p>
              <div className="soil-big-bar"><div className="soil-big-fill" style={{width:`${pct(k)}%`}}/></div>
            </div>
          ))}
        </div>
      </div>
      <div className="lifted" style={{paddingBottom:30}}>
        <div className="seg" style={{marginBottom:18}}>
          <button className={tab==="readings"?"on":""} onClick={()=>setTab("readings")}>Readings</button>
          <button className={tab==="adjust"?"on":""} onClick={()=>setTab("adjust")}>Adjust values</button>
          <button className={tab==="log"?"on":""} onClick={()=>setTab("log")}>History</button>
        </div>

        {tab==="readings"&&(
          <>
            {[...SOIL_KEYS,"moisture","temperature","humidity"].map((k,i,arr)=>(
              <React.Fragment key={k}>
                <div className="log-row">
                  <div className="ib md gr"><Droplets size={18} strokeWidth={1.8}/></div>
                  <div className="log-body">
                    <p className="log-title">{SENSOR_META[k].label}</p>
                    <p className="log-sub">Ideal: {SENSOR_META[k].ideal} {SENSOR_META[k].unit}</p>
                  </div>
                  <span className="log-val">{sensors[k]}<span style={{fontSize:11,color:"rgba(22,36,28,.4)"}}> {SENSOR_META[k].unit}</span></span>
                  <TrendIcon k={k}/>
                </div>
                {i<arr.length-1&&<div className="divider"/>}
              </React.Fragment>
            ))}
            <div className="card" style={{background:"var(--g100)",border:"none",cursor:"pointer",marginTop:8}} onClick={()=>nav("ai")}>
              <p style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em",color:"var(--g700)",marginBottom:8}}>AI fertiliser advice</p>
              <p style={{fontSize:14,fontWeight:600,color:"var(--g800)",marginBottom:4}}>{sensors._lastResult?.fertDesc||"Tap to run AI analysis"}</p>
              <p style={{fontSize:13,color:"rgba(15,61,42,.65)",lineHeight:1.45}}>84% model confidence · tap to view full recommendation</p>
            </div>
          </>
        )}

        {tab==="adjust"&&(
          <>
            <p style={{fontSize:13,color:"rgba(22,36,28,.55)",lineHeight:1.5,marginBottom:18}}>
              Drag sliders to update sensor readings. Changes reflect immediately across all screens and feed into the AI analysis.
            </p>
            {Object.keys(SENSOR_META).map(k=>{
              const m=SENSOR_META[k];
              return(
                <div className="slider-row" key={k}>
                  <label>{m.label}<span>{sensors[k]} {m.unit}</span></label>
                  <input type="range" min={m.min} max={m.max} step={m.step} value={sensors[k]}
                    onChange={e=>setSensors(s=>({...s,[k]:Number(e.target.value)}))}/>
                  <p className="ideal-tag">Ideal: {m.ideal} {m.unit}</p>
                </div>
              );
            })}
            <button className="btn p" style={{marginTop:8}} onClick={()=>nav("ai")}>
              <Sparkles size={16}/>Run AI analysis with these values
            </button>
          </>
        )}

        {tab==="log"&&(
          <>
            {SOIL_LOG.map((l,i)=>(
              <React.Fragment key={l.date}>
                <div className="log-row">
                  <div className="ib md gr"><BarChart2 size={18} strokeWidth={1.8}/></div>
                  <div className="log-body">
                    <p className="log-title">{l.field}</p>
                    <p className="log-sub">{l.date}</p>
                    <p style={{fontSize:12,fontFamily:"var(--fm)",color:"rgba(22,36,28,.6)",marginTop:4}}>{l.val}</p>
                  </div>
                </div>
                {i<SOIL_LOG.length-1&&<div className="divider"/>}
              </React.Fragment>
            ))}
            <button className="btn o" style={{width:"100%",marginTop:16}}>Load earlier readings</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 10 — AI RECOMMENDATION  (live Anthropic API call)
───────────────────────────────────────────────────────────────────── */
function AIScreen({fieldName,sensors,setSensors,nav}){
  const [status,setStatus]=useState("idle"); // idle | loading | done | error
  const [result,setResult]=useState(null);
  const [errMsg,setErrMsg]=useState("");

  const run=useCallback(async()=>{
    setStatus("loading"); setResult(null); setErrMsg("");
    try{
      // Calls our own backend (FastAPI), which runs the trained scikit-learn
      // crop/fertiliser models and returns the same result shape this screen
      // expects. The previous version of this screen called
      // api.anthropic.com directly from the browser with no API key attached
      // — that only worked inside the Claude artifact sandbox, which injects
      // credentials automatically. Outside that sandbox it would 401 every
      // time, and even with a key, shipping API keys to client-side JS is
      // unsafe since anyone can read them from devtools.
      const parsed=await fetchPrediction(
        {pH:sensors.pH,N:sensors.N,P:sensors.P,K:sensors.K,
         temperature:sensors.temperature,humidity:sensors.humidity,
         pressure:sensors.pressure,moisture:sensors.moisture},
        fieldName||"North Plot"
      );
      setResult(parsed);
      setStatus("done");
      // propagate top result back to global sensor state so Dashboard + Field show it
      setSensors(s=>({...s,_lastResult:{
        crop:parsed.crop,cropConf:parsed.cropConf,
        fertDesc:parsed.fertDesc,fertConf:parsed.fertConf,
      }}));
    }catch(e){
      setErrMsg(e.message||"The analysis could not be completed. Check your connection and try again.");
      setStatus("error");
    }
  }, [fieldName, sensors.pH, sensors.N, sensors.P, sensors.K, sensors.temperature, sensors.humidity, sensors.pressure, sensors.moisture]);

  useEffect(()=>{run();}, [run]);

  const fertColors=["","fert-class-1","fert-class-2","fert-class-3"];
  const fertIcons=[null,FlaskConical,Sprout,Droplets];

  return(
    <div className="nv-screen ai-screen">
      <div className="ai-hero">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
          <button className="bk" onClick={()=>nav("field")}><ChevronLeft size={18}/></button>
          <button style={{background:"rgba(247,244,236,.12)",border:"none",color:"rgba(247,244,236,.8)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,opacity:status==="loading"?.5:1}} onClick={run} disabled={status==="loading"}>
            <RefreshCw size={13} style={status==="loading"?{animation:"nv-spin .9s linear infinite"}:{}}/>Re-analyse
          </button>
        </div>
        <p style={{fontFamily:"var(--fm)",fontSize:11,letterSpacing:".08em",textTransform:"uppercase",color:"rgba(247,244,236,.55)",marginBottom:8}}>AI recommendation</p>
        <h1 style={{fontFamily:"var(--fd)",fontWeight:600,fontSize:26,color:"var(--cream)",marginBottom:4}}>{fieldName||"North Plot"}</h1>
        <p style={{fontSize:13,color:"rgba(247,244,236,.55)",display:"flex",alignItems:"center",gap:5}}><MapPin size={12}/>Kaduna, Nigeria</p>
      </div>

      <div className="lifted">
        {status==="loading"&&(
          <div className="ai-spinner-wrap">
            <div className="ai-spinner-ring"/>
            <p className="ai-spinner-text">Analysing your soil readings against<br/>West African crop databases…</p>
          </div>
        )}

        {status==="error"&&(
          <div className="ai-error" style={{marginTop:8}}>
            <AlertTriangle size={28} style={{color:"var(--red)",marginBottom:12}}/>
            <p style={{marginBottom:16}}>{errMsg}</p>
            <button className="btn p" style={{maxWidth:200,margin:"0 auto"}} onClick={run}>Try again</button>
          </div>
        )}

        {status==="done"&&result&&(
          <>
            {/* top crop */}
            <div className="ai-result-hero">
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
                <div>
                  <p style={{fontSize:12,color:"rgba(247,244,236,.6)",marginBottom:6}}>Top recommended crop</p>
                  <p className="ai-crop-big">{result.crop}</p>
                  <p className="ai-crop-conf">{result.cropConf}% model confidence</p>
                </div>
                <span className="pill" style={{background:"rgba(247,244,236,.15)",color:"rgba(247,244,236,.9)"}}>{result.soilHealth} soil</span>
              </div>
              <div className="conf-bar-wrap"><div className="conf-bar-fill" style={{width:`${result.cropConf}%`}}/></div>
            </div>

            {/* alternatives */}
            <p className="sec-lbl" style={{marginTop:4}}>Alternative crops</p>
            <div className="card" style={{cursor:"default"}}>
              {result.alternatives?.map((a,i)=>(
                <React.Fragment key={a.name}>
                  <div className="alt-row">
                    <span className="alt-name">{a.name}</span>
                    <div className="alt-bar-wrap"><div className="alt-bar-fill" style={{width:`${a.conf}%`}}/></div>
                    <span className="alt-conf">{a.conf}%</span>
                  </div>
                  {i<(result.alternatives.length-1)&&<div className="divider"/>}
                </React.Fragment>
              ))}
            </div>

            {/* fertiliser */}
            <p className="sec-lbl">Fertiliser recommendation</p>
            <div className={`fert-card ${fertColors[result.fertClass]||"fert-class-1"}`}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div className="ib md gr">
                  {React.createElement(fertIcons[result.fertClass]||FlaskConical,{size:19,strokeWidth:1.8})}
                </div>
                <div>
                  <p style={{fontWeight:600,fontSize:14,color:"var(--ink)"}}>Class {result.fertClass} fertiliser</p>
                  <p style={{fontFamily:"var(--fm)",fontSize:11.5,color:"rgba(22,36,28,.5)",marginTop:2}}>{result.fertConf}% confidence</p>
                </div>
              </div>
              <p style={{fontSize:13.5,color:"rgba(22,36,28,.7)",lineHeight:1.5}}>{result.fertDesc}</p>
            </div>

            {/* actionable advice */}
            <p className="sec-lbl">Farm advice</p>
            {result.advice?.map((tip,i)=>(
              <div className="advice-row" key={i}>
                <div className="advice-icon"><Leaf size={16} strokeWidth={1.8}/></div>
                <div className="advice-body"><span>{tip}</span></div>
              </div>
            ))}

            {/* warning strip */}
            {result.warning&&(
              <>
                <p className="sec-lbl">Risk alert</p>
                <div className="alert-strip">
                  <AlertTriangle size={18} style={{color:"var(--amber)",flexShrink:0,marginTop:2}}/>
                  <div><p style={{fontSize:13.5,color:"rgba(22,36,28,.65)",lineHeight:1.45}}>{result.warning}</p></div>
                </div>
              </>
            )}

            {/* sensor summary used */}
            <p className="sec-lbl">Sensor readings used</p>
            <div className="card" style={{cursor:"default"}}>
              <div className="stat-grid">
                {["pH","N","P","K","moisture","temperature","humidity"].map(k=>(
                  <div className="stat-tile" key={k}>
                    <p className="stat-lbl">{SENSOR_META[k].label.split(" ")[0]}</p>
                    <p className="stat-val">{sensors[k]}<span className="stat-unit"> {SENSOR_META[k].unit}</span></p>
                  </div>
                ))}
              </div>
              <button className="btn o" style={{width:"100%",marginTop:12}} onClick={()=>nav("soil")}>
                <SlidersHorizontal size={14}/>Adjust readings
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 11 — USER PROFILE
───────────────────────────────────────────────────────────────────── */
const MENU=[
  {Icon:Edit3,   label:"Edit profile",           sub:"Name, phone, location"},
  {Icon:Shield,  label:"Security",               sub:"Password & 2-step verification"},
  {Icon:Bell,    label:"Notification preferences",sub:"Alerts, digests"},
  {Icon:Tractor, label:"Farm management",        sub:"Fields, crops, sensors",to:"farmmanagement"},
  {Icon:HelpCircle,label:"Help & support",       sub:"FAQs, contact us"},
];
function ProfileScreen({userName,fieldName,nav}){
  return(
    <div className="nv-screen" style={{background:"var(--s50)"}}>
      <div className="prof-hero">
        <div style={{position:"absolute",top:20,left:20}}>
          <button className="bk" style={{background:"rgba(247,244,236,.12)",marginBottom:0}} onClick={()=>nav("dashboard")}><ChevronLeft size={18}/></button>
        </div>
        <div className="avatar"><User size={36} style={{color:"rgba(247,244,236,.7)"}}/><button className="avatar-edit"><Camera size={13}/></button></div>
        <p className="prof-name">{userName||"Novyra Farmer"}</p>
        <p className="prof-role">Small-scale farmer · Kaduna, Nigeria</p>
      </div>
      <div className="prof-lifted">
        <div className="prof-stats">
          <div className="prof-stat"><p className="prof-stat-val">1</p><p className="prof-stat-key">Fields</p></div>
          <div className="prof-stat"><p className="prof-stat-val">2.4</p><p className="prof-stat-key">Hectares</p></div>
          <div className="prof-stat"><p className="prof-stat-val">3</p><p className="prof-stat-key">Seasons</p></div>
        </div>
        <p className="sec-lbl" style={{marginTop:0}}>Account</p>
        {MENU.map(({Icon,label,sub,to},i)=>(
          <React.Fragment key={label}>
            <button className="menu-row" onClick={()=>to?nav(to):null}>
              <div className="ib md gr"><Icon size={19} strokeWidth={1.8}/></div>
              <div style={{flex:1}}><p className="menu-lbl">{label}</p><p className="menu-sub">{sub}</p></div>
              <ChevronRight size={17} style={{color:"rgba(22,36,28,.28)"}}/>
            </button>
            {i<MENU.length-1&&<div className="divider"/>}
          </React.Fragment>
        ))}
        <div className="divider" style={{marginTop:8}}/>
        <button className="btn danger" style={{width:"100%",marginTop:10,borderRadius:14}} onClick={()=>nav("auth")}>
          <LogOut size={16}/>Sign out
        </button>
        <p style={{textAlign:"center",fontSize:11.5,color:"rgba(22,36,28,.35)",marginTop:16}}>Novyra v1.0.0 · © 2025 Novyra Inc.</p>
      </div>
      <TabBar active="profile" onHome={()=>nav("dashboard")} onFields={()=>nav("field")} onAlerts={()=>nav("alerts")} onProfile={()=>nav("profile")}/>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 12 — ALERTS
───────────────────────────────────────────────────────────────────── */
const ALL_ALERTS=[
  {id:1,type:"weather",Icon:CloudRain,  c:"am",title:"Rain expected Thursday",         time:"Just now",  unread:true, desc:"Consider postponing fertiliser application by 48 h to avoid runoff loss."},
  {id:2,type:"soil",   Icon:Droplets,   c:"re",title:"Low phosphorus detected",        time:"2h ago",    unread:true, desc:"Soil P at 42 mg/kg — below optimal. Apply phosphorus-rich fertiliser soon."},
  {id:3,type:"crop",   Icon:Sprout,     c:"gr",title:"Maize harvest window approaching",time:"Yesterday",unread:false,desc:"Estimated 18 days to optimal harvest. Prepare storage and logistics."},
  {id:4,type:"weather",Icon:Wind,       c:"am",title:"Strong winds forecast Saturday", time:"2 days ago",unread:false,desc:"Winds up to 45 km/h. Secure greenhouse structures and young seedlings."},
  {id:5,type:"soil",   Icon:Thermometer,c:"gr",title:"Soil temperature optimal",       time:"3 days ago",unread:false,desc:"Soil temp 28°C — ideal conditions for maize germination and root growth."},
  {id:6,type:"system", Icon:Bell,       c:"gy",title:"Weekly farm digest ready",       time:"6 days ago",unread:false,desc:"Your soil, weather and yield summary for the week ending 28 Jun 2025."},
];
function AlertsScreen({nav}){
  const [f,setF]=useState("All");
  const shown=ALL_ALERTS.filter(a=>f==="All"||a.type===f.toLowerCase());
  return(
    <div className="nv-screen" style={{background:"var(--s50)"}}>
      <TopBar title="Alerts" sub={`${ALL_ALERTS.filter(a=>a.unread).length} unread`} onBack={()=>nav("dashboard")}/>
      <div className="nv-scroll" style={{paddingTop:6}}>
        <div className="filter-row">
          {["All","Weather","Soil","Crop","System"].map(x=>(
            <button key={x} className={`chip${f===x?" on":""}`} onClick={()=>setF(x)}>{x}</button>
          ))}
        </div>
        {shown.map((a,i)=>(
          <React.Fragment key={a.id}>
            <div className="alert-item">
              <div className={`ib md ${a.c}`}><a.Icon size={19} strokeWidth={1.8}/></div>
              <div className="alert-body">
                <p className="alert-title">{a.title}</p>
                <p className="alert-meta">{a.time}</p>
                <p className="alert-desc">{a.desc}</p>
              </div>
              {a.unread&&<span className="unread-dot"/>}
            </div>
            {i<shown.length-1&&<div className="divider"/>}
          </React.Fragment>
        ))}
        {!shown.length&&<p style={{textAlign:"center",color:"rgba(22,36,28,.45)",fontSize:14,paddingTop:30}}>No {f.toLowerCase()} alerts.</p>}
      </div>
      <TabBar active="alerts" onHome={()=>nav("dashboard")} onFields={()=>nav("field")} onAlerts={()=>nav("alerts")} onProfile={()=>nav("profile")}/>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SCREEN 13 — FARM MANAGEMENT
───────────────────────────────────────────────────────────────────── */
const INIT_FIELDS=[
  {id:1,name:"North Plot",crop:"Maize",  area:"2.4",status:"healthy",planted:"14 Apr 2025"},
  {id:2,name:"South Block",crop:"Cassava",area:"1.8",status:"warning",planted:"02 Mar 2025"},
];
function FarmManagementScreen({nav,notify}){
  const [fields,setFields]=useState(INIT_FIELDS);
  const [adding,setAdding]=useState(false);
  const [newName,setNewName]=useState("");
  const del=id=>setFields(f=>f.filter(x=>x.id!==id));
  const add=()=>{
    if(!newName.trim())return;
    setFields(f=>[...f,{id:Date.now(),name:newName.trim(),crop:"—",area:"—",status:"healthy",planted:"Today"}]);
    setNewName("");setAdding(false);
  };
  const total=fields.reduce((a,f)=>a+(parseFloat(f.area)||0),0);
  return(
    <div className="nv-screen" style={{background:"var(--s50)"}}>
      <TopBar title="Farm management" sub="Manage your fields and crops" onBack={()=>nav("dashboard")}
        right={<button style={{background:"var(--g100)",color:"var(--g800)",padding:"8px 14px",fontSize:13,fontWeight:600,border:"none",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}} onClick={()=>setAdding(v=>!v)}><Plus size={15}/>Add field</button>}/>
      <div className="nv-scroll">
        <div className="sum-grid" style={{marginBottom:18}}>
          <div className="sum-tile"><p className="sum-val">{fields.length}</p><p className="sum-key">Total fields</p><p className="sum-sub">+1 this season</p></div>
          <div className="sum-tile"><p className="sum-val">{total.toFixed(1)} ha</p><p className="sum-key">Total area</p><p className="sum-sub">{fields.length} active crops</p></div>
        </div>
        {adding&&(
          <div className="card" style={{cursor:"default",marginBottom:14}}>
            <p style={{fontWeight:600,fontSize:14,color:"var(--ink)",marginBottom:10}}>New field name</p>
            <div className="iw" style={{marginBottom:12}}>
              <Layers size={17}/>
              <input style={{flex:1,border:"none",background:"transparent",outline:"none",padding:"11px 0",fontSize:15,color:"var(--ink)",fontFamily:"var(--fb)"}}
                placeholder="e.g. East Block" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} autoFocus/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn o" style={{flex:1}} onClick={()=>{setAdding(false);setNewName("");}}>Cancel</button>
              <button className="btn p" style={{flex:1}} onClick={add} disabled={!newName.trim()}>Add</button>
            </div>
          </div>
        )}
        <p className="sec-lbl" style={{marginTop:0}}>Your fields</p>
        {fields.map((f,i)=>(
          <React.Fragment key={f.id}>
            <div className="card" style={{display:"flex",alignItems:"center",gap:13,cursor:"default"}}>
              <div className={`ib md ${f.status==="warning"?"am":"gr"}`}><Sprout size={20} strokeWidth={1.8}/></div>
              <div style={{flex:1}}><p className="fm-name">{f.name}</p><p className="fm-meta">{f.crop} · {f.area} ha · {f.planted}</p></div>
              <div className="fm-btns">
                <button className="fm-btn" title="Edit" onClick={()=>notify(`Editing "${f.name}" — full form coming soon`)}><Edit3 size={15}/></button>
                <button className="fm-btn del" title="Delete" onClick={()=>del(f.id)}><Trash2 size={15}/></button>
              </div>
            </div>
            {i<fields.length-1&&<div className="divider"/>}
          </React.Fragment>
        ))}
        {!fields.length&&(
          <div style={{textAlign:"center",padding:"40px 0 20px",color:"rgba(22,36,28,.45)"}}>
            <Layers size={32} style={{marginBottom:12,opacity:.3}}/>
            <p style={{fontSize:14}}>No fields yet. Add your first field above.</p>
          </div>
        )}
        <p className="sec-lbl" style={{marginTop:20}}>Sensor devices</p>
        {[{id:"SN-001",field:"North Plot",status:"Online",last:"2 min ago"},{id:"SN-002",field:"South Block",status:"Offline",last:"3 days ago"}].map((d,i,arr)=>(
          <React.Fragment key={d.id}>
            <div style={{display:"flex",alignItems:"center",gap:13,padding:"12px 0"}}>
              <div className={`ib md ${d.status==="Online"?"gr":"am"}`}><Circle size={18} strokeWidth={d.status==="Online"?2.5:1.5}/></div>
              <div style={{flex:1}}><p style={{fontWeight:600,fontSize:14,color:"var(--ink)",marginBottom:2}}>{d.id}</p><p style={{fontSize:12.5,color:"rgba(22,36,28,.5)"}}>{d.field} · last sync {d.last}</p></div>
              <span className={`pill ${d.status==="Online"?"gr":"am"}`}>{d.status}</span>
            </div>
            {i<arr.length-1&&<div className="divider"/>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ROOT — global sensor state + state machine
───────────────────────────────────────────────────────────────────── */
export default function NovyraApp(){
  const [screen,setScreen]   = useState("splash");
  const [userName,setUserName]= useState("");
  const [fieldName,setFieldName]=useState("North Plot");
  const [sensors,setSensors] = useState(DEFAULT_SENSORS); // shared across all screens
  const [toast,setToast]     = useState(null);
  const toastRef             = useRef();

  const notify=msg=>{setToast(msg);clearTimeout(toastRef.current);toastRef.current=setTimeout(()=>setToast(null),2400);};
  const nav=s=>setScreen(s);

  const sp={sensors,setSensors,fieldName,nav,notify,userName};

  return(
    <div className="nv-root">
      <style>{STYLES}</style>
      <div className="nv-frame">
        {screen==="splash"        && <SplashScreen       onDone={()=>nav("onboarding")}/>}
        {screen==="onboarding"    && <OnboardingScreen   onDone={()=>nav("auth")}/>}
        {screen==="auth"          && <AuthScreen         onBack={()=>nav("onboarding")} onRegister={()=>nav("register")} onDone={()=>nav("dashboard")}/>}
        {screen==="register"      && <RegScreen          onLogin={()=>nav("auth")} onDone={(n,f)=>{if(n)setUserName(n);if(f)setFieldName(f);nav("dashboard");}}/>}
        {screen==="dashboard"     && <DashboardScreen    {...sp}/>}
        {screen==="quickactions"  && <QuickActionsScreen {...sp}/>}
        {screen==="field"         && <FieldScreen        {...sp}/>}
        {screen==="weather"       && <WeatherScreen      {...sp}/>}
        {screen==="soil"          && <SoilScreen         {...sp}/>}
        {screen==="ai"            && <AIScreen           {...sp}/>}
        {screen==="profile"       && <ProfileScreen      {...sp}/>}
        {screen==="alerts"        && <AlertsScreen       {...sp}/>}
        {screen==="farmmanagement"&& <FarmManagementScreen {...sp}/>}
        {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
      </div>
    </div>
  );
}