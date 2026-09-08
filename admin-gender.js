(function () {
  function genderText(lead, korean) {
    if (lead.gender === 'male') return korean ? '남성' : '男';
    if (lead.gender === 'female') return korean ? '여성' : '女';
    return '';
  }

  const previousRender = renderLeads;
  renderLeads = function () {
    previousRender.apply(this, arguments);
    document.querySelectorAll('#lead-list .lead-row').forEach(row => {
      const select = row.querySelector('.invalid-reason-select');
      const id = select ? select.id.replace('invalid-reason-', '') : '';
      const lead = leads.find(item => String(item.id) === id);
      const meta = row.querySelector('.lead-meta');
      if (!lead || !meta || !genderText(lead)) return;
      const item = document.createElement('span');
      item.textContent = '性別 ' + genderText(lead);
      meta.prepend(item);
    });
  };

  const previousDetails = openDetails;
  openDetails = function (id) {
    previousDetails(id);
    const lead = leads.find(item => String(item.id) === String(id));
    const grid = document.querySelector('#detail-body .detail-grid');
    if (lead && grid) grid.insertAdjacentHTML('beforeend', detailItem('性別', genderText(lead) || '未填'));
  };

  const previousCopy = clientCopyText;
  clientCopyText = function (lead) {
    const text = previousCopy(lead);
    if (!genderText(lead)) return text;
    const korean = /^FORM_V[34]_KOREAN/.test(String(lead.q4_foreign_currency_account || ''));
    const lines = text.split('\n');
    lines.splice(1, 0, (korean ? '성별：' : '性別：') + genderText(lead, korean));
    return lines.join('\n');
  };

  exportCSV = async function () {
    const cols = ['created_at','name','age','gender','city','id_number','phone','line_id','q1_existing_loan','q2_bank_status','q3_amount_needed','q4_foreign_currency_account','status','invalid_reason','base_duplicate','base_duplicate_source','traffic_source','notes'];
    const button = document.getElementById('export-btn');
    button.disabled = true;
    button.textContent = '匯出中...';
    try {
      const rows = selectedLeadIds.size > 0 ? await fetchSelectedLeads() : await fetchFilteredLeadsForExport();
      if (!rows.length) {
        alert('目前沒有可匯出的名單。');
        return;
      }
      const csv = [cols.join(',')].concat(rows.map(row => cols.map(col => {
        const value = col === 'gender' ? genderText(row) : row[col];
        return '"' + String(value || '').replace(/"/g, '""') + '"';
      }).join(','))).join('\n');
      const url = URL.createObjectURL(new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'leads-' + new Date().toISOString().slice(0, 10) + '.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('匯出失敗：' + error.message);
    } finally {
      button.disabled = false;
      updateSelectionUI(leads);
    }
  };
}());
