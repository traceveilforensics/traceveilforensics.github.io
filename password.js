const bcrypt = require('bcryptjs');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('\n=== Password Hash Generator ===\n');
  console.log('Usage:');
  console.log('  node password.js mypassword    - Generate hash for a password');
  console.log('  node password.js compare       - Compare password with hash\n');
  console.log('Or in package.json scripts:');
  console.log('  npm run hash -- "mypassword"   - Generate hash');
  console.log('  npm run hash                   - Interactive mode\n');
  process.exit(0);
}

if (args[0] === 'compare') {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Enter hash: ', (hash) => {
    readline.question('Enter password to compare: ', (password) => {
      bcrypt.compare(password, hash, (err, result) => {
        console.log('\nResult:', result ? 'MATCH ✓' : 'NO MATCH ✗');
        readline.close();
      });
    });
  });
} else {
  const password = args[0];
  const saltRounds = args[1] || 10;

  bcrypt.hash(password, parseInt(saltRounds), (err, hash) => {
    if (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
    console.log('\n=== Password Hash ===\n');
    console.log('Password:', password);
    console.log('Hash:    ', hash);
    console.log('\n=== SQL Insert Statement ===\n');
    console.log(`INSERT INTO users (email, password_hash, first_name, last_name, role)`);
    console.log(`VALUES (`);
    console.log(`  'admin@traceveilforensics.com',`);
    console.log(`  '${hash}',`);
    console.log(`  'Admin',`);
    console.log(`  'User',`);
    console.log(`  'admin'`);
    console.log(`);\n`);
  });
}
