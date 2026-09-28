const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n🚀 ATS Resume Builder - Deployment Script\n');

const deployOptions = [
  { name: 'Netlify', value: 'netlify' },
  { name: 'Vercel', value: 'vercel' },
  { name: 'Firebase', value: 'firebase' },
];

console.log('Select deployment platform:');
deployOptions.forEach((option, index) => {
  console.log(`${index + 1}. ${option.name}`);
});

rl.question('\nEnter choice (1-3): ', (choice) => {
  const selected = deployOptions[parseInt(choice) - 1];

  if (!selected) {
    console.log('Invalid choice. Exiting...');
    rl.close();
    return;
  }

  console.log(`\n📦 Building project...`);
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Build failed:', error.message);
    rl.close();
    return;
  }

  console.log(`\n🚀 Deploying to ${selected.name}...`);

  try {
    switch (selected.value) {
      case 'netlify':
        console.log('\n📝 Deploying to Netlify...');
        execSync('npx netlify deploy --prod --dir=build', { stdio: 'inherit' });
        break;

      case 'vercel':
        console.log('\n📝 Deploying to Vercel...');
        execSync('npx vercel --prod', { stdio: 'inherit' });
        break;

      case 'firebase':
        console.log('\n📝 Deploying to Firebase...');
        execSync('firebase deploy', { stdio: 'inherit' });
        break;

      default:
        // Unreachable while `deployOptions` and this switch stay in sync -
        // the `!selected` guard above already rejects any choice outside the
        // three known values. The case is still required so that a future
        // addition to `deployOptions` that forgets to add a matching case
        // here fails loudly instead of falling through to the success
        // message below without deploying anything.
        throw new Error(`Unknown deployment target: ${selected.value}`);
    }

    console.log(`\n✅ Deployment successful!\n`);
  } catch (error) {
    console.error(`\n❌ Deployment failed:`, error.message);
  }

  rl.close();
});
