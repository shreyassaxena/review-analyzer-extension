document.getElementById('analyze').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const loadingDiv = document.getElementById('loading');
  const analyzeButton = document.getElementById('analyze');
  
  loadingDiv.style.display = 'block';
  analyzeButton.disabled = true;
  
  chrome.runtime.sendMessage({
    action: 'analyzeReviews',
    url: tab.url
  }, response => {
    loadingDiv.style.display = 'none';
    analyzeButton.disabled = false;
    
    if (response.status === 'success' || response.status === 'already_analyzed') {
      updateDisplay(response.analysis);
    } else {
      alert('Error analyzing page: ' + response.message);
    }
  });
});

document.getElementById('reset').addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all analysis?')) {
    chrome.storage.local.set({ reviewAnalysis: null }, () => {
      updateDisplay({ pros: [], cons: [], sourcesAnalyzed: [] });
    });
  }
});

document.getElementById('summarizePros').addEventListener('click', async () => {
  const button = document.getElementById('summarizePros');
  button.disabled = true;
  button.textContent = 'Summarizing...';
  
  chrome.runtime.sendMessage({
    action: 'summarizePoints',
    pointType: 'pros'
  }, response => {
    button.disabled = false;
    button.textContent = 'Summarize Pros';
    
    if (response.status === 'success') {
      updateDisplay(response.analysis);
    } else {
      alert('Error summarizing pros: ' + response.message);
    }
  });
});

document.getElementById('summarizeCons').addEventListener('click', async () => {
  const button = document.getElementById('summarizeCons');
  button.disabled = true;
  button.textContent = 'Summarizing...';
  
  chrome.runtime.sendMessage({
    action: 'summarizePoints',
    pointType: 'cons'
  }, response => {
    button.disabled = false;
    button.textContent = 'Summarize Cons';
    
    if (response.status === 'success') {
      updateDisplay(response.analysis);
    } else {
      alert('Error summarizing cons: ' + response.message);
    }
  });
});

function updateDisplay(analysis) {
  const prosList = document.getElementById('prosList');
  const consList = document.getElementById('consList');
  
  prosList.innerHTML = analysis.pros.map(pro => `<li>${pro}</li>`).join('');
  consList.innerHTML = analysis.cons.map(con => `<li>${con}</li>`).join('');
}

// Load existing analysis when popup opens
chrome.storage.local.get(['reviewAnalysis'], (result) => {
  if (result.reviewAnalysis) {
    updateDisplay(result.reviewAnalysis);
  }
});