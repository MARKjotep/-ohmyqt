import { logDate } from "./@";

export async function Cmd(cmd: string, log?: boolean) {
  const CS = cmd.split(";");

  for (const cc of CS) {
    const _fcmd = cc.trim().split(" ");
    const procee = Bun.spawn(_fcmd);
    await procee.exited;
  }

  log && logDate("cmd");
}
