const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envTemplate = `REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
`;

const questions = [
  { name: 'REACT_APP_FIREBASE_API_KEY', message: 'Enter Firebase API Key: ' },
  { name: 'REACT_APP_FIREBASE_AUTH_DOMAIN', message: 'Enter Firebase Auth Domain: ' },
  { name: 'REACT_APP_FIREBASE_PROJECT_ID', message: 'Enter Firebase Project ID: ' },
  { name: 'REACT_APP_FIREBASE_STORAGE_BUCKET', message: 'Enter Firebase Storage Bucket: ' },
  { name: 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID', message: 'Enter Firebase Messaging Sender ID: ' },
  { name: 'REACT_APP_FIREBASE_APP_ID', message: 'Enter Firebase App ID: ' },
  { name: 'REACT_APP_FIREBASE_MEASUREMENT_ID', message: 'Enter Firebase Measurement ID (optional): ' }
];

const envPath = path.join(process.cwd(), '.env');

console.log('\n🔥 Firebase Configuration Setup\n');

const askQuestion = (index, envVars = {}) => {
  if (index >= questions.length) {
    let envContent = '';
    Object.keys(envVars).forEach(key => {
      envContent += `${key}=${envVars[key] || ''}\n`;
    });

    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!\n');
    console.log('📝 Next steps:');
    console.log('1. Run `npm install` to install dependencies');
    console.log('2. Run `npm start` to start the development server\n');
    rl.close();
    return;
  }

  const question = questions[index];
  rl.question(question.message, (answer) => {
    envVars[question.name] = answer;
    askQuestion(index + 1, envVars);
  });
};

if (fs.existsSync(envPath)) {
  rl.question('⚠️  .env file already exists. Overwrite? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      askQuestion(0);
    } else {
      console.log('\n❌ Setup cancelled.\n');
      rl.close();
    }
  });
} else {
  askQuestion(0);
}