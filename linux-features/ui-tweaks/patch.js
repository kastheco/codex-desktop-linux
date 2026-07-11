"use strict";

const sidebarProjectName = require("./patches/sidebar-project-name.js");
const sidebarTaskList = require("./patches/sidebar-task-list.js");

function patchesFrom(...modules) {
  return modules.flatMap((moduleExports) =>
    Array.isArray(moduleExports?.descriptors) ? moduleExports.descriptors : [],
  );
}

module.exports = {
  descriptors: patchesFrom(sidebarProjectName, sidebarTaskList),
};
