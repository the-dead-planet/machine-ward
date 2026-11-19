import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const windows = process.platform === 'win32';
const result = spawnSync(windows ? 'gradlew.bat' : './gradlew', process.argv.slice(2), {
    cwd: join(__dirname, '../../app-mobile/android'),
    stdio: 'inherit',
    shell: windows,
});

if (result.error) {
    console.error(result.error.message);
}

process.exit(result.status ?? 1);
