#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  discoverLinuxFeatureManifests,
  loadLinuxFeaturePatchDescriptors,
} = require("../../scripts/lib/linux-features.js");
const {
  DEFAULT_PROJECT_NAME_STYLE,
  PROJECTS_SIDEBAR_ASSET_PATTERN,
  PROJECT_NAME_SELECTOR,
  RUNTIME_MARKER,
  STYLE_ID,
  applySidebarProjectNameStylePatch,
  descriptors: patches,
  sidebarProjectNameCss,
} = require("./patches/sidebar-project-name.js");
const {
  ACTIVE_SECTION_RUNTIME_MARKER,
  ATTENTION_STATUS_ATTRIBUTE,
  SIDEBAR_PAGE_ASSET_PATTERN,
  STATUS_RUNTIME_MARKER,
  STYLE_ID: TASK_LIST_STYLE_ID,
  STYLE_RUNTIME_MARKER: TASK_LIST_STYLE_RUNTIME_MARKER,
  TASK_ROW_ASSET_PATTERN,
  applySidebarActiveSectionPatch,
  applySidebarTaskListStylePatch,
  applySidebarTaskStatusPatch,
  sidebarTaskListCss,
} = require("./patches/sidebar-task-list.js");

function projectBundleFixture() {
  return [
    "function row(){let j=Pn(`group/folder-row group relative flex h-[var(--height-token-row)] text-sm text-token-foreground`);",
    "let V=(0,Iy.jsx)(`span`,{className:`min-w-0 truncate pr-1`,children:p});return [j,V]}",
  ].join("");
}

function sidebarPageBundleFixture() {
  return [
    "function XHe(){let y=[`pinned`],s={threadAttentionStateByKey:new Map([[`pinned`,`running`]])},k={chatKeys:[`one`,`two`],chatAttentionStates:[`review`,`idle`],pinnedKeys:[`codex:thread:pinned`]},a={formatMessage:()=>`Tasks`},B=a.formatMessage(c4.label),V=(0,n3.jsx)(o4,{children:(0,n3.jsx)(ZHe,{keys:k.chatKeys,mode:l,onOrderChange:R})}),H=k.pinnedKeys.length===0?null:(0,n3.jsx)(ZHe,{keys:k.pinnedKeys}),te=null;",
    "return(0,n3.jsxs)(RHe,{children:[(0,n3.jsx)(ZO,{targets:F,onSelect:L}),(0,n3.jsx)(JO,{currentTarget:I,isActive:()=>I!=null,targets:P,onSelect:L}),H,null,te]})}",
    "pn.sidebarThreadRow({active:false,pinned:true});pn.sidebarSection({collapsed:false,heading:`Pinned`})",
  ].join("");
}

function taskRowBundleFixture() {
  return [
    "function status(e){let{statusState:n}=e;",
    "if(n.type===`loading`)return jsx(`div`,{className:`relative flex size-5 shrink-0 items-center justify-center text-token-foreground/70`,children:jsx(Spinner,{className:`icon-xs shrink-0`,animationDurationMs:2e3})});",
    "if(n.unread===!0)return jsx(`span`,{className:`icon-xs relative scale-50`});",
    "let rail=jsx(`div`,{className:J(`flex w-4 shrink-0 items-center justify-center`,disabled)});",
    "return null}",
  ].join("");
}

function applyPatchTwice(source, context) {
  const patched = applySidebarProjectNameStylePatch(source, context);
  assert.equal(applySidebarProjectNameStylePatch(patched, context), patched);
  return patched;
}

function copyFeatureTo(featuresRoot) {
  const featureDir = path.join(featuresRoot, "ui-tweaks");
  fs.mkdirSync(featureDir, { recursive: true });
  for (const name of ["feature.json", "README.md", "patch.js"]) {
    fs.copyFileSync(path.join(__dirname, name), path.join(featureDir, name));
  }
  fs.cpSync(path.join(__dirname, "patches"), path.join(featureDir, "patches"), { recursive: true });
}

function withCapturedWarns(fn) {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (message) => warnings.push(String(message));
  try {
    return { value: fn(), warnings };
  } finally {
    console.warn = originalWarn;
  }
}

test("ui-tweaks is discoverable and disabled until listed in features.json", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-tweaks-feature-"));
  try {
    const featuresRoot = path.join(tempDir, "linux-features");
    fs.mkdirSync(featuresRoot, { recursive: true });
    copyFeatureTo(featuresRoot);
    fs.writeFileSync(path.join(featuresRoot, "features.example.json"), '{"enabled":[]}\n');

    const manifests = discoverLinuxFeatureManifests({ featuresRoot });
    assert.equal(manifests.length, 1);
    assert.equal(manifests[0].id, "ui-tweaks");
    assert.equal(manifests[0].manifest.defaultEnabled, false);
    assert.deepEqual(loadLinuxFeaturePatchDescriptors({ featuresRoot }), []);

    fs.writeFileSync(path.join(featuresRoot, "features.json"), '{"enabled":["ui-tweaks"]}\n');
    const descriptors = loadLinuxFeaturePatchDescriptors({ featuresRoot });
    assert.deepEqual(
      descriptors.map((descriptor) => [descriptor.id, descriptor.phase, descriptor.ciPolicy]),
      [
        ["feature:ui-tweaks:sidebar-project-name-style", "webview-asset", "optional"],
        ["feature:ui-tweaks:sidebar-active-section", "webview-asset", "optional"],
        ["feature:ui-tweaks:sidebar-task-list-style", "webview-asset", "optional"],
        ["feature:ui-tweaks:sidebar-task-status-markers", "webview-asset", "optional"],
      ],
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("sidebar project descriptor targets only the current project sidebar asset", () => {
  assert.match(
    "app-initial~app-main~automations-page-BcHjEK7e.js",
    PROJECTS_SIDEBAR_ASSET_PATTERN,
  );
  assert.match("app-initial~app-main~page-BF1QkwFT.js", PROJECTS_SIDEBAR_ASSET_PATTERN);
  assert.doesNotMatch("projects-index-page-TFjtVwC4.js", PROJECTS_SIDEBAR_ASSET_PATTERN);
  assert.doesNotMatch(
    "app-initial~app-main~remote-conversation-page~projects-index-page-By2_tGIM.js",
    PROJECTS_SIDEBAR_ASSET_PATTERN,
  );
});

test("sidebar task descriptors target the current page and shared task row assets", () => {
  assert.match("app-initial~app-main~page-BF1QkwFT.js", SIDEBAR_PAGE_ASSET_PATTERN);
  assert.match(
    "app-initial~app-main~projects-index-page~hotkey-window-thread-page~thread-app-shell-chrome~~bg7586oi-Cs6pZQzU.js",
    TASK_ROW_ASSET_PATTERN,
  );
  assert.doesNotMatch("projects-index-page-TFjtVwC4.js", SIDEBAR_PAGE_ASSET_PATTERN);
  assert.doesNotMatch("app-initial~app-main~page-BF1QkwFT.js", TASK_ROW_ASSET_PATTERN);
});

test("sidebar task list injects a comfortable hierarchy stylesheet once", () => {
  const source = sidebarPageBundleFixture();
  const patched = applySidebarTaskListStylePatch(source);

  assert.equal(applySidebarTaskListStylePatch(patched), patched);
  assert.match(patched, new RegExp(TASK_LIST_STYLE_ID));
  assert.match(patched, new RegExp(TASK_LIST_STYLE_RUNTIME_MARKER));
  assert.match(patched, /min-height:40px!important/);
  assert.match(patched, /data-app-action-sidebar-section-heading=\\"Pinned\\"/);
  assert.match(patched, /Attention/);
});

test("sidebar active section extracts running and attention keys above the normal list", () => {
  const source = sidebarPageBundleFixture();
  const patched = applySidebarActiveSectionPatch(source);

  assert.equal(applySidebarActiveSectionPatch(patched), patched);
  assert.match(patched, new RegExp(ACTIVE_SECTION_RUNTIME_MARKER));
  assert.match(patched, /state===`running`\|\|e\.state===`review`/);
  assert.match(patched, /heading:`Active`/);
  assert.match(patched, /keys:__codexLinuxActiveKeys/);
  assert.match(patched, /keys:__codexLinuxRegularKeys/);
  assert.match(patched, /keys:__codexLinuxRegularPinnedKeys/);
  assert.match(patched, /threadAttentionStateByKey\.get/);
  assert.match(patched, /__codexLinuxActiveSection,H,null,te/);
});

test("sidebar task status patch marks running and attention indicators once", () => {
  const source = taskRowBundleFixture();
  const patched = applySidebarTaskStatusPatch(source);

  assert.equal(applySidebarTaskStatusPatch(patched), patched);
  assert.match(patched, new RegExp(STATUS_RUNTIME_MARKER));
  assert.ok(patched.includes(`"${ATTENTION_STATUS_ATTRIBUTE}":\`running\``));
  assert.ok(patched.includes(`"${ATTENTION_STATUS_ATTRIBUTE}":\`attention\``));
  assert.match(patched, /flex min-w-4 shrink-0 items-center justify-center/);
});

test("sidebar task list CSS distinguishes pinned, running, and attention states", () => {
  const css = sidebarTaskListCss();

  assert.match(css, /sidebar-section-heading=\"Active\"/);
  assert.match(css, /sidebar-section-heading=\"Pinned\"/);
  assert.match(css, /thread-status=\"running\"/);
  assert.match(css, /thread-status=\"attention\"/);
  assert.match(css, /editorWarning-foreground/);
  assert.match(css, /font-weight:650/);
  assert.match(css, /width:26px!important;height:26px!important/);
  assert.match(css, /background:transparent;border:0;box-shadow:none/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("sidebar task list can be disabled independently", () => {
  const context = {
    feature: {
      manifest: { tweaks: { sidebar: { taskList: { enabled: true } } } },
      settings: { tweaks: { sidebar: { taskList: { enabled: false } } } },
    },
  };

  assert.equal(applySidebarTaskListStylePatch(sidebarPageBundleFixture(), context), sidebarPageBundleFixture());
  assert.equal(applySidebarActiveSectionPatch(sidebarPageBundleFixture(), context), sidebarPageBundleFixture());
  assert.equal(applySidebarTaskStatusPatch(taskRowBundleFixture(), context), taskRowBundleFixture());
});

test("sidebar task patches fail soft when upstream markers drift", () => {
  const page = withCapturedWarns(() =>
    applySidebarTaskListStylePatch("sidebar bundle changed", { warnOnMissingMarkers: true }),
  );
  const row = withCapturedWarns(() =>
    applySidebarTaskStatusPatch("task row bundle changed", { warnOnMissingMarkers: true }),
  );
  const active = withCapturedWarns(() =>
    applySidebarActiveSectionPatch("sidebar active bundle changed", { warnOnMissingMarkers: true }),
  );

  assert.equal(page.value, "sidebar bundle changed");
  assert.equal(row.value, "task row bundle changed");
  assert.equal(active.value, "sidebar active bundle changed");
  assert.match(page.warnings[0], /current sidebar page markers/);
  assert.match(row.warnings[0], /current task status markers/);
  assert.match(active.warnings[0], /current active section markers/);
});

test("patch injects sidebar project-name stylesheet runtime once", () => {
  const context = {
    feature: {
      manifest: {
        tweaks: {
          sidebar: {
            projectName: {
              style: DEFAULT_PROJECT_NAME_STYLE,
            },
          },
        },
      },
      settings: {
        tweaks: {
          sidebar: {
            projectName: {
              style: "font-weight: 800 !important; color: red;",
            },
          },
        },
      },
    },
  };

  const patched = applyPatchTwice(projectBundleFixture(), context);

  assert.match(patched, new RegExp(STYLE_ID));
  assert.match(patched, new RegExp(RUNTIME_MARKER));
  assert.match(patched, /font-weight: 800 !important; color: red;/);
  assert.ok(
    patched.includes(JSON.stringify(sidebarProjectNameCss("font-weight: 800 !important; color: red;"))),
  );
  assert.equal((patched.match(new RegExp(STYLE_ID, "g")) ?? []).length, 1);
});

test("feature manifest defaults reach descriptor context through the feature loader", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-tweaks-manifest-defaults-"));
  try {
    const featuresRoot = path.join(tempDir, "linux-features");
    fs.mkdirSync(featuresRoot, { recursive: true });
    copyFeatureTo(featuresRoot);
    fs.writeFileSync(path.join(featuresRoot, "features.json"), '{"enabled":["ui-tweaks"]}\n');

    const [descriptor] = loadLinuxFeaturePatchDescriptors({ featuresRoot });
    const patched = descriptor.apply(projectBundleFixture(), {});

    assert.match(patched, /font-weight: 700 !important; padding-top: 0.25rem;/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("default project name style is bold with top padding and no forced color", () => {
  const featureJson = JSON.parse(fs.readFileSync(path.join(__dirname, "feature.json"), "utf8"));
  assert.equal(featureJson.tweaks.sidebar.projectName.style, DEFAULT_PROJECT_NAME_STYLE);
  assert.match(DEFAULT_PROJECT_NAME_STYLE, /font-weight:\s*700\s*!important/);
  assert.match(DEFAULT_PROJECT_NAME_STYLE, /padding-top:\s*0\.25rem/);
  assert.doesNotMatch(DEFAULT_PROJECT_NAME_STYLE, /color/i);
  assert.doesNotMatch(sidebarProjectNameCss(DEFAULT_PROJECT_NAME_STYLE), /#000|black/i);
});

test("feature settings override the tracked defaults through features.json", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-tweaks-settings-"));
  try {
    const featuresRoot = path.join(tempDir, "linux-features");
    fs.mkdirSync(featuresRoot, { recursive: true });
    copyFeatureTo(featuresRoot);
    fs.writeFileSync(
      path.join(featuresRoot, "features.json"),
      `${JSON.stringify(
        {
          enabled: ["ui-tweaks"],
          settings: {
            "ui-tweaks": {
              tweaks: {
                sidebar: {
                  projectName: {
                    style: "font-weight: 800 !important; color: red;",
                  },
                },
              },
            },
          },
        },
        null,
        2,
      )}\n`,
    );

    const [descriptor] = loadLinuxFeaturePatchDescriptors({ featuresRoot });
    const patched = descriptor.apply(projectBundleFixture(), {});

    assert.match(patched, /font-weight: 800 !important; color: red;/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("invalid feature settings warn and fall back to defaults", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-tweaks-invalid-settings-"));
  try {
    const featuresRoot = path.join(tempDir, "linux-features");
    fs.mkdirSync(featuresRoot, { recursive: true });
    copyFeatureTo(featuresRoot);
    fs.writeFileSync(
      path.join(featuresRoot, "features.json"),
      '{"enabled":["ui-tweaks"],"settings":{"ui-tweaks":false}}\n',
    );

    const { value: descriptors, warnings } = withCapturedWarns(() =>
      loadLinuxFeaturePatchDescriptors({ featuresRoot }),
    );
    const patched = descriptors[0].apply(projectBundleFixture(), {});

    assert.match(warnings.join("\n"), /WARN: Linux feature 'ui-tweaks' settings/);
    assert.match(patched, /font-weight: 700 !important; padding-top: 0.25rem;/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("patch skips unrelated assets", () => {
  const source = "console.log('not the sidebar');";
  const { value, warnings } = withCapturedWarns(() => applySidebarProjectNameStylePatch(source));

  assert.equal(value, source);
  assert.deepEqual(warnings, []);
});

test("drift warning returns source unchanged", () => {
  const source = [
    "function Hd(){return {id:`sidebarElectron.projectsNavLink`,defaultMessage:`Projects`}}",
    "function row(){let j=Pn(`group/folder-row group relative flex`);return j}",
  ].join("");

  const { value, warnings } = withCapturedWarns(() => applySidebarProjectNameStylePatch(source));

  assert.equal(value, source);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /^WARN: Could not find current sidebar project name markers/);
});

test("target asset drift warning returns source unchanged when all markers are missing", () => {
  const source = "console.log('projects sidebar bundle drifted');";

  const { value, warnings } = withCapturedWarns(() => patches[0].apply(source, {}));

  assert.equal(value, source);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /^WARN: Could not find current sidebar project name markers/);
});

test("invalid and empty styles warn and fall back without throwing", () => {
  for (const badStyle of [42, "   "]) {
    const { value, warnings } = withCapturedWarns(() =>
      applySidebarProjectNameStylePatch(projectBundleFixture(), {
        feature: {
          manifest: {
            tweaks: {
              sidebar: {
                projectName: {
                  style: DEFAULT_PROJECT_NAME_STYLE,
                },
              },
            },
          },
          settings: {
            tweaks: {
              sidebar: {
                projectName: {
                  style: badStyle,
                },
              },
            },
          },
        },
      }),
    );

    assert.match(value, new RegExp(STYLE_ID));
    assert.match(value, /font-weight: 700 !important; padding-top: 0.25rem;/);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /^WARN: ui-tweaks sidebar project name style/);
  }
});

test("unsafe styles warn, stay scoped, and fall back to the default", () => {
  const unsafeStyle = "font-weight:700;} body{display:none} /*";
  const { value, warnings } = withCapturedWarns(() =>
    applySidebarProjectNameStylePatch(projectBundleFixture(), {
      feature: {
        settings: {
          tweaks: {
            sidebar: {
              projectName: {
                style: unsafeStyle,
              },
            },
          },
        },
      },
    }),
  );

  assert.match(value, new RegExp(STYLE_ID));
  assert.match(value, /font-weight: 700 !important; padding-top: 0.25rem;/);
  assert.doesNotMatch(value, /body\{display:none\}/);
  assert.equal(value.includes(unsafeStyle), false);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /^WARN: ui-tweaks sidebar project name style must be a safe CSS declaration list/);
});
