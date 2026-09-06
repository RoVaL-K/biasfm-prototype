const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function check(dir){for(const file of fs.readdirSync(dir,{withFileTypes:true})){const name=path.join(dir,file.name);if(file.isDirectory())check(name);else if(file.name.endsWith('.js'))execFileSync(process.execPath,['--check',name]);}}
check(path.join(root,'js'));check(path.join(root,'lib'));execFileSync(process.execPath,['--check',path.join(root,'server.js')]);
const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
for(const dir of ['js','css'])fs.cpSync(path.join(root,dir),path.join(out,dir),{recursive:true});
for(const file of ['index.html','404.html','konzept.html'])fs.copyFileSync(path.join(root,file),path.join(out,file));
console.log('Public assets validated and copied to dist/. Run server.js for the complete application.');
