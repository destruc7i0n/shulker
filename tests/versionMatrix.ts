import { appendFileSync } from 'fs';
import { compareVersions } from './lib';

interface VersionInfo {
  javaVersion: number;
  mcVersion: string;
}

interface VersionManifest {
  versions: Array<{
    id: string;
    url: string;
  }>;
}

interface VersionDetails {
  javaVersion?: {
    majorVersion: number;
  };
}

const FALLBACK_JAVA_VERSION = 21;

async function generateVersionMatrix(): Promise<void> {
  try {
    const { testedVersions } = require('mineflayer/lib/version');
    
    const versionsToTest = testedVersions.slice(-10);
    
    const manifestResponse = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
    const manifest: VersionManifest = await manifestResponse.json();
    
    const versionMap = Object.fromEntries(manifest.versions.map(v => [v.id, v]));
    
    const matrixItems: VersionInfo[] = await Promise.all(
      versionsToTest.map(async (mcVersion): Promise<VersionInfo> => {
        const versionInfo = versionMap[mcVersion];
        if (!versionInfo) {
          console.error(`Version not found in manifest: ${mcVersion}`);
          return { javaVersion: FALLBACK_JAVA_VERSION, mcVersion };
        }
        
        try {
          const versionDetailsResponse = await fetch(versionInfo.url);
          const versionDetails: VersionDetails = await versionDetailsResponse.json();
          
          const javaVersion = versionDetails.javaVersion?.majorVersion ?? FALLBACK_JAVA_VERSION;
          return { javaVersion, mcVersion };
        } catch (err) {
          console.error(`Error fetching version data for ${mcVersion}:`, err);
          return {
            javaVersion: FALLBACK_JAVA_VERSION,
            mcVersion
          };
        }
      })
    );
    
    // Sort by version in descending order
    matrixItems.sort((a, b) => -compareVersions(a.mcVersion, b.mcVersion));
    
    console.log('Generated matrix:');
    matrixItems.forEach(item => {
      console.log(`  MC ${item.mcVersion} -> Java ${item.javaVersion}`);
    });
    
    // Create the matrix object
    const matrix = { include: matrixItems };
    const matrixJson = JSON.stringify(matrix);
    
    // Write to GitHub Actions output
    const githubOutput = process.env.GITHUB_OUTPUT;
    if (githubOutput) {
      appendFileSync(githubOutput, `matrix=${matrixJson}\n`);
    } else {
      console.log(`matrix=${matrixJson}`);
    }
    
  } catch (error) {
    console.error('Error generating version matrix:', error);
    process.exit(1);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  generateVersionMatrix();
}

export { generateVersionMatrix };
