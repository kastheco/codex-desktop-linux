"use strict";

const SIDEBAR_PAGE_ASSET_PATTERN =
  /^app-initial~app-main~(?:automations-page|page)-[^.]+\.js$/;
const TASK_ROW_ASSET_PATTERN =
  /^app-initial~app-main~projects-index-page~hotkey-window-thread-page~thread-app-shell-chrome~[^.]+\.js$/;
const STYLE_ID = "codex-linux-ui-tweaks-sidebar-task-list-style-v3";
const STYLE_RUNTIME_MARKER = "codexLinuxUiTweaksSidebarTaskListStyleRuntimeV3";
const STATUS_RUNTIME_MARKER = "codexLinuxUiTweaksSidebarTaskStatusRuntimeV3";
const ACTIVE_SECTION_RUNTIME_MARKER = "codexLinuxUiTweaksSidebarActiveSectionRuntimeV2";
const ACTIVE_SECTION_RUNTIME_MARKER_V1 = "codexLinuxUiTweaksSidebarActiveSectionRuntime";
const ATTENTION_STATUS_ATTRIBUTE = "data-codex-linux-thread-status";

const ATTENTION_ICON_ANCHOR = "className:`icon-xs relative scale-50`";
const RUNNING_ICON_ANCHOR =
  "className:`icon-xs shrink-0`,animationDurationMs:2e3";
const RUNNING_WRAPPER_ANCHOR =
  "className:`relative flex size-5 shrink-0 items-center justify-center text-token-foreground/70`,children:";
const STATUS_RAIL_ANCHOR = "className:J(`flex w-4 shrink-0 items-center justify-center`";
const STATUS_RAIL_PATCHED_ANCHOR =
  "className:J(`flex min-w-4 shrink-0 items-center justify-center`";
const ACTIVE_SECTION_INSERTION_ANCHOR =
  "B=a.formatMessage(c4.label),V=(0,n3.jsx)(o4,";
const ACTIVE_SECTION_RETURN_ANCHOR =
  "children:[(0,n3.jsx)(ZO,{targets:F,onSelect:L}),(0,n3.jsx)(JO,{currentTarget:I,isActive:()=>I!=null,targets:P,onSelect:L}),H,null,te]";
const SIDEBAR_PAGE_MARKERS = [
  "sidebarThreadRow",
  "sidebarSection({collapsed:",
  "heading:`Pinned`",
];
const TASK_ROW_MARKERS = [
  "statusState:n",
  "n.type===`loading`",
  "n.unread===!0",
  ATTENTION_ICON_ANCHOR,
  RUNNING_ICON_ANCHOR,
];

function warn(message) {
  console.warn(`WARN: ${message} - skipping ui-tweaks sidebar task list patch`);
}

function sidebarTaskListConfig(context) {
  const defaults = context?.feature?.manifest?.tweaks?.sidebar?.taskList;
  const settings = context?.feature?.settings?.tweaks?.sidebar?.taskList;
  return {
    ...(defaults != null && typeof defaults === "object" && !Array.isArray(defaults) ? defaults : {}),
    ...(settings != null && typeof settings === "object" && !Array.isArray(settings) ? settings : {}),
  };
}

function sidebarTaskListCss() {
  const row = "[data-app-action-sidebar-thread-row]";
  const activeSection = '[data-app-action-sidebar-section-heading="Active"]';
  const pinnedSection = '[data-app-action-sidebar-section-heading="Pinned"]';
  const tasksSection = '[data-app-action-sidebar-section-heading="Tasks"]';
  const attention = `[${ATTENTION_STATUS_ATTRIBUTE}="attention"]`;
  const running = `[${ATTENTION_STATUS_ATTRIBUTE}="running"]`;

  return [
    `${row}{min-height:40px!important;height:40px!important;margin-block:1px;border-radius:7px!important;padding-inline:3px;transition:background-color 120ms ease,box-shadow 120ms ease;}`,
    `${row} [data-thread-title]{font-size:14px;line-height:20px;font-weight:500;}`,
    `${row}:has(${running}){background:color-mix(in srgb,var(--vscode-textLink-foreground) 5%,transparent);box-shadow:inset 2px 0 0 color-mix(in srgb,var(--vscode-textLink-foreground) 78%,transparent);}`,
    `${row}:has(${running}) [data-thread-title]{font-weight:600;}`,
    `${row} ${running}{width:32px!important;height:32px!important;color:var(--vscode-textLink-foreground)!important;}`,
    `${row} ${running} svg{width:26px!important;height:26px!important;}`,
    `${row}:has(${attention}){--codex-linux-attention:var(--vscode-editorWarning-foreground,#d69e2e);background:color-mix(in srgb,var(--codex-linux-attention) 11%,transparent);box-shadow:inset 3px 0 0 var(--codex-linux-attention),inset 0 0 0 1px color-mix(in srgb,var(--codex-linux-attention) 20%,transparent);}`,
    `${row}:has(${attention}):hover{background:color-mix(in srgb,var(--codex-linux-attention) 16%,var(--token-list-hover-background,transparent));}`,
    `${row}:has(${attention}) [data-thread-title]{font-weight:650;color:var(--vscode-foreground);}`,
    `${row} div:has(>${attention}){width:70px!important;height:26px!important;gap:6px;justify-content:flex-end!important;color:var(--codex-linux-attention);}`,
    `${row} div:has(>${attention})::before{content:"Attention";font-size:10px;line-height:16px;font-weight:700;letter-spacing:0;color:var(--codex-linux-attention);}`,
    `${row} ${attention}{display:block!important;width:11px!important;height:11px!important;transform:none!important;border-radius:999px;box-shadow:0 0 0 3px color-mix(in srgb,var(--codex-linux-attention) 18%,transparent);}`,
    `${row} ${attention}>span{background:currentColor!important;}`,
    `${activeSection}{box-sizing:border-box;margin:7px 4px 11px;padding:5px 5px 7px;border:1px solid color-mix(in srgb,var(--vscode-foreground) 10%,transparent);border-radius:8px;background:color-mix(in srgb,var(--vscode-sideBar-background,var(--vscode-editor-background)) 76%,var(--vscode-foreground) 4%);box-shadow:0 1px 0 color-mix(in srgb,var(--vscode-foreground) 5%,transparent);}`,
    `${activeSection} ${row}{margin-inline:0;}`,
    `${pinnedSection}{box-sizing:border-box;margin:3px 0 9px;padding:0;background:transparent;border:0;box-shadow:none;}`,
    `${pinnedSection} ${row}{margin-inline:0;}`,
    `${pinnedSection} ${row}[data-app-action-sidebar-thread-pinned="true"] [data-thread-title]{font-weight:620;}`,
    `${tasksSection}{padding-top:2px;}`,
    `@media (prefers-reduced-motion:reduce){${row}{transition:none;}}`,
  ].join("");
}

function applySidebarActiveSectionPatch(source, context = {}) {
  try {
    if (typeof source !== "string") {
      warn("Asset source is not a string");
      return source;
    }
    if (
      sidebarTaskListConfig(context).enabled === false ||
      source.includes(ACTIVE_SECTION_RUNTIME_MARKER)
    ) {
      return source;
    }
    if (source.includes(ACTIVE_SECTION_RUNTIME_MARKER_V1)) {
      const oldPairs =
        "__codexLinuxActivePairs=k.chatKeys.map((e,t)=>({key:e,state:k.chatAttentionStates[t]})).filter(e=>e.state===`running`||e.state===`review`)";
      const newPairs =
        "__codexLinuxActivePairs=[...k.chatKeys.map((e,t)=>({key:e,state:k.chatAttentionStates[t]})),...y.map(e=>({key:Im(e),state:s.threadAttentionStateByKey.get(e)??`idle`}))].filter(e=>e.state===`running`||e.state===`review`)";
      let upgraded = source.replace(oldPairs, newPairs);
      upgraded = upgraded.replace(
        "__codexLinuxRegularKeys=k.chatKeys.filter(e=>!__codexLinuxActiveKeySet.has(e))",
        "__codexLinuxRegularKeys=k.chatKeys.filter(e=>!__codexLinuxActiveKeySet.has(e)),__codexLinuxRegularPinnedKeys=k.pinnedKeys.filter(e=>!__codexLinuxActiveKeySet.has(e))",
      );
      upgraded = upgraded.replace(
        "H=k.pinnedKeys.length===0",
        "H=__codexLinuxRegularPinnedKeys.length===0",
      );
      upgraded = upgraded.replace("keys:k.pinnedKeys", "keys:__codexLinuxRegularPinnedKeys");
      if (
        upgraded === source ||
        !upgraded.includes("__codexLinuxRegularPinnedKeys") ||
        upgraded.includes("H=k.pinnedKeys.length===0") ||
        upgraded.includes("keys:k.pinnedKeys")
      ) {
        warn("Could not upgrade the existing active section for pinned running tasks");
        return source;
      }
      return `${upgraded}\n;const ${ACTIVE_SECTION_RUNTIME_MARKER}=true;`;
    }

    if (
      !source.includes(ACTIVE_SECTION_INSERTION_ANCHOR) ||
      !source.includes(ACTIVE_SECTION_RETURN_ANCHOR) ||
      !source.includes("keys:k.chatKeys,mode:l") ||
      !source.includes("H=k.pinnedKeys.length===0") ||
      !source.includes("keys:k.pinnedKeys")
    ) {
      if (context.warnOnMissingMarkers === true) warn("Could not find current active section markers");
      return source;
    }

    const activeVariables = [
      "B=a.formatMessage(c4.label)",
      "__codexLinuxActivePairs=[...k.chatKeys.map((e,t)=>({key:e,state:k.chatAttentionStates[t]})),...y.map(e=>({key:Im(e),state:s.threadAttentionStateByKey.get(e)??`idle`}))].filter(e=>e.state===`running`||e.state===`review`)",
      "__codexLinuxActiveKeys=__codexLinuxActivePairs.map(e=>e.key)",
      "__codexLinuxActiveKeySet=new Set(__codexLinuxActiveKeys)",
      "__codexLinuxRegularKeys=k.chatKeys.filter(e=>!__codexLinuxActiveKeySet.has(e))",
      "__codexLinuxRegularPinnedKeys=k.pinnedKeys.filter(e=>!__codexLinuxActiveKeySet.has(e))",
      "__codexLinuxActiveLabel=`Active`",
      "__codexLinuxActiveSection=__codexLinuxActiveKeys.length===0?null:(0,n3.jsx)(z2,{containerId:`codex-linux-active`,children:(0,n3.jsx)(o4,{collapsed:!1,heading:`Active`,label:__codexLinuxActiveLabel,sectionKey:`codex-linux-active`,children:(0,n3.jsx)(ZHe,{chatGptSource:w,codexProjectKindByThreadKey:D,conversationByKey:A,keys:__codexLinuxActiveKeys,mode:l,projectByKey:j,projectSortMode:c,threadContainerId:`codex-linux-active`},l)})})",
      "V=(0,n3.jsx)(o4,",
    ].join(",");

    let patched = source.replace(ACTIVE_SECTION_INSERTION_ANCHOR, activeVariables);
    patched = patched.replace("keys:k.chatKeys,mode:l", "keys:__codexLinuxRegularKeys,mode:l");
    patched = patched.replace(
      "H=k.pinnedKeys.length===0",
      "H=__codexLinuxRegularPinnedKeys.length===0",
    );
    patched = patched.replace("keys:k.pinnedKeys", "keys:__codexLinuxRegularPinnedKeys");
    patched = patched.replace(
      ACTIVE_SECTION_RETURN_ANCHOR,
      ACTIVE_SECTION_RETURN_ANCHOR.replace("H,null,te", "__codexLinuxActiveSection,H,null,te"),
    );
    return `${patched}\n;const ${ACTIVE_SECTION_RUNTIME_MARKER}=true;`;
  } catch (error) {
    warn(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return source;
  }
}

function sidebarTaskListStyleRuntimeSource() {
  const css = sidebarTaskListCss();
  return [
    `;(()=>{const ${STYLE_RUNTIME_MARKER}=true;`,
    `const STYLE_ID=${JSON.stringify(STYLE_ID)};`,
    `const CSS=${JSON.stringify(css)};`,
    `function install(){if(typeof document==="undefined")return;const target=document.head||document.documentElement;if(!target)return;let style=document.getElementById(STYLE_ID);if(style){style.textContent!==CSS&&(style.textContent=CSS);return}style=document.createElement("style");style.id=STYLE_ID;style.textContent=CSS;target.appendChild(style)}`,
    `document.readyState==="loading"&&document.addEventListener("DOMContentLoaded",install,{once:true});install();})();`,
  ].join("");
}

function applySidebarTaskListStylePatch(source, context = {}) {
  try {
    if (typeof source !== "string") {
      warn("Asset source is not a string");
      return source;
    }
    if (sidebarTaskListConfig(context).enabled === false) return source;
    if (source.includes(STYLE_RUNTIME_MARKER) || source.includes(STYLE_ID)) return source;
    if (!SIDEBAR_PAGE_MARKERS.every((marker) => source.includes(marker))) {
      if (context.warnOnMissingMarkers === true) warn("Could not find current sidebar page markers");
      return source;
    }
    return `${source}\n${sidebarTaskListStyleRuntimeSource()}`;
  } catch (error) {
    warn(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return source;
  }
}

function applySidebarTaskStatusPatch(source, context = {}) {
  try {
    if (typeof source !== "string") {
      warn("Asset source is not a string");
      return source;
    }
    if (sidebarTaskListConfig(context).enabled === false || source.includes(STATUS_RUNTIME_MARKER)) {
      return source;
    }
    if (!TASK_ROW_MARKERS.every((marker) => source.includes(marker))) {
      if (
        context.warnOnMissingMarkers === true ||
        TASK_ROW_MARKERS.some((marker) => source.includes(marker))
      ) {
        warn("Could not find current task status markers");
      }
      return source;
    }

    const attentionProperty = `"${ATTENTION_STATUS_ATTRIBUTE}":\`attention\``;
    const runningProperty = `"${ATTENTION_STATUS_ATTRIBUTE}":\`running\``;
    let patched = source;
    if (!patched.includes(attentionProperty)) {
      patched = patched.replace(ATTENTION_ICON_ANCHOR, `${attentionProperty},${ATTENTION_ICON_ANCHOR}`);
    }
    if (!patched.includes(`${runningProperty},${RUNNING_WRAPPER_ANCHOR}`)) {
      patched = patched.replace(
        RUNNING_WRAPPER_ANCHOR,
        `${runningProperty},${RUNNING_WRAPPER_ANCHOR}`,
      );
    }
    if (patched.includes(STATUS_RAIL_ANCHOR)) {
      patched = patched.replace(STATUS_RAIL_ANCHOR, STATUS_RAIL_PATCHED_ANCHOR);
    } else if (!patched.includes(STATUS_RAIL_PATCHED_ANCHOR)) {
      warn("Could not find current task status rail marker");
      return source;
    }
    return `${patched}\n;const ${STATUS_RUNTIME_MARKER}=true;`;
  } catch (error) {
    warn(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return source;
  }
}

const descriptors = [
  {
    id: "sidebar-active-section",
    phase: "webview-asset",
    order: 20_795,
    ciPolicy: "optional",
    pattern: SIDEBAR_PAGE_ASSET_PATTERN,
    missingDescription: "sidebar page bundle",
    skipDescription: "ui-tweaks sidebar active section patch",
    apply: (source, context = {}) =>
      applySidebarActiveSectionPatch(source, { ...context, warnOnMissingMarkers: true }),
  },
  {
    id: "sidebar-task-list-style",
    phase: "webview-asset",
    order: 20_800,
    ciPolicy: "optional",
    pattern: SIDEBAR_PAGE_ASSET_PATTERN,
    missingDescription: "sidebar page bundle",
    skipDescription: "ui-tweaks sidebar task list style patch",
    apply: (source, context = {}) =>
      applySidebarTaskListStylePatch(source, { ...context, warnOnMissingMarkers: true }),
  },
  {
    id: "sidebar-task-status-markers",
    phase: "webview-asset",
    order: 20_810,
    ciPolicy: "optional",
    pattern: TASK_ROW_ASSET_PATTERN,
    missingDescription: "sidebar task row bundle",
    skipDescription: "ui-tweaks sidebar task status marker patch",
    apply: (source, context = {}) => applySidebarTaskStatusPatch(source, context),
  },
];

module.exports = {
  ACTIVE_SECTION_RUNTIME_MARKER,
  ATTENTION_STATUS_ATTRIBUTE,
  SIDEBAR_PAGE_ASSET_PATTERN,
  STATUS_RUNTIME_MARKER,
  STYLE_ID,
  STYLE_RUNTIME_MARKER,
  TASK_ROW_ASSET_PATTERN,
  applySidebarActiveSectionPatch,
  applySidebarTaskListStylePatch,
  applySidebarTaskStatusPatch,
  descriptors,
  sidebarTaskListCss,
  sidebarTaskListStyleRuntimeSource,
};
