import { getRunningServers } from '../utils/lock-file.js'
import { renderStatusTable } from '../utils/ascii-table.js'

export async function statusCommand(): Promise<void> {
  const servers = await getRunningServers()

  const tableData = servers.map(s => ({
    path: s.path,
    port: s.port,
    url: `http://127.0.0.1:${s.port}`
  }))

  console.log(renderStatusTable(tableData))
}
