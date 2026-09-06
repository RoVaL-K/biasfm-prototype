const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const file=path.join(__dirname,'../.env');
if(fs.existsSync(file)){console.log('Existing .env preserved. Configure any missing provider keys there.');}
else{const template=fs.readFileSync(path.join(__dirname,'../.env.example'),'utf8');fs.writeFileSync(file,template.replace('EDITORIAL_TOKEN=','EDITORIAL_TOKEN='+crypto.randomBytes(32).toString('hex')),{mode:0o600,flag:'wx'});console.log('Created private .env with a secure editorial key. Provider keys and operator details remain to be configured.');}
