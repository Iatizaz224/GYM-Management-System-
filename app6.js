function exportBackup(){var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='NEXT-Gym-Backup.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
function importBackup(input){if(!input.files||!input.files[0])return;var r=new FileReader();r.onload=function(){try{var data=JSON.parse(r.result);state=data;normalize();saveState();alert('Backup restored')}catch(e){alert('Invalid backup file')}};r.readAsText(input.files[0])}
function renderAll(){normalize();renderHome();renderSchedule();renderClients();renderPayments();renderWaiting();renderReport();renderSettings()}
loadState();renderAll();
