#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function usage() {
  console.error('Usage: npm run note -- "あなたのメモ"')
}

const args = process.argv.slice(2)
if (args.length === 0) {
  usage()
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const notesPath = path.resolve(__dirname, '..', 'NOTES.md')

const now = new Date()
const pad = (n)=> String(n).padStart(2,'0')
const yyyy = now.getFullYear()
const mm = pad(now.getMonth()+1)
const dd = pad(now.getDate())
const hh = pad(now.getHours())
const mi = pad(now.getMinutes())
const dateHeading = `## ${yyyy}-${mm}-${dd}`
const line = `- [${hh}:${mi}] ${args.join(' ')}`

let content = ''
if (fs.existsSync(notesPath)) {
  content = fs.readFileSync(notesPath, 'utf8')
}

if (!content.includes(dateHeading)) {
  if (content.trim().length > 0 && !content.endsWith('\n')) content += '\n'
  content += `\n${dateHeading}\n\n${line}\n`
} else {
  // Append under the existing date heading: find last occurrence of the heading block
  const parts = content.split(dateHeading)
  const before = parts.slice(0, -1).join(dateHeading)
  const after = parts[parts.length - 1]
  // Insert the line right after the heading in the last block occurrence
  const afterLines = after.split('\n')
  // Ensure heading line is followed by a blank line and entries
  if (afterLines.length === 0) {
    content = before + dateHeading + `\n\n${line}\n`
  } else {
    // Reconstruct: heading + existing (ensure single trailing newline), then new line
    let tail = after
    if (!tail.startsWith('\n')) tail = '\n' + tail
    if (!tail.endsWith('\n')) tail = tail + '\n'
    content = before + dateHeading + tail + line + '\n'
  }
}

fs.writeFileSync(notesPath, content, 'utf8')
console.log(`Appended note to ${path.relative(process.cwd(), notesPath)}`)

