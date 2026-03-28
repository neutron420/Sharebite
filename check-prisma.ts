import prisma from "./lib/prisma";

async function check() {
  console.log("Prisma keys:", Object.keys(prisma).filter(k => !k.startsWith("_")));
  if (prisma.bugReport) {
    console.log("bugReport exists");
  } else {
    console.log("bugReport IS UNDEFINED");
  }
}

check();
