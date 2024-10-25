chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeReviews") {
    chrome.storage.local.get(['reviewAnalysis'], async (result) => {
      const currentAnalysis = result.reviewAnalysis || { pros: [], cons: [], sourcesAnalyzed: [] };
      
      if (currentAnalysis.sourcesAnalyzed.includes(request.url)) {
        sendResponse({ 
          status: 'already_analyzed',
          analysis: currentAnalysis
        });
        return;
      }

      try {
        // Get cleaned content from Jina
        const cleanContent = await getJinaContent(request.url);
        const analysis = await analyzeWithOpenAI(cleanContent, currentAnalysis);
        analysis.sourcesAnalyzed.push(request.url);
        
        chrome.storage.local.set({ reviewAnalysis: analysis }, () => {
          sendResponse({ 
            status: 'success',
            analysis: analysis
          });
        });
      } catch (error) {
        sendResponse({ 
          status: 'error',
          message: error.message
        });
      }
    });
    return true;
  }
    
    if (request.action === "summarizePoints") {
    chrome.storage.local.get(['reviewAnalysis'], async (result) => {
      try {
        const currentAnalysis = result.reviewAnalysis;
        const summarized = await summarizePoints(
          request.pointType === 'pros' ? currentAnalysis.pros : currentAnalysis.cons,
          request.pointType
        );
        
        // Update only the requested type (pros or cons)
        const updatedAnalysis = {
          ...currentAnalysis,
          [request.pointType]: summarized
        };
        
        chrome.storage.local.set({ reviewAnalysis: updatedAnalysis }, () => {
          sendResponse({ 
            status: 'success',
            analysis: updatedAnalysis
          });
        });
      } catch (error) {
        sendResponse({ 
          status: 'error',
          message: error.message
        });
      }
    });
    return true;
  }  
});

async function getJinaContent(url) {
  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const response = await fetch(jinaUrl);
    
    if (!response.ok) {
      throw new Error(`Jina API returned status: ${response.status}`);
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('Error fetching from Jina:', error);
    throw new Error('Failed to process page content with Jina');
  }
}

async function analyzeWithOpenAI(content, currentAnalysis) {
  const API_KEY = 'YOUR-OPENAI-API-KEY';
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a product review analyzer. Extract unique pros and cons from the given content. Return only points that aren't already in the existing analysis. Format your response as a JSON object with 'pros' and 'cons' arrays."
          },
          {
            role: "user",
            content: `Current analysis:
            Pros: ${currentAnalysis.pros.join(', ')}
            Cons: ${currentAnalysis.cons.join(', ')}
            
            New content to analyze:
            ${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { "type": "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned status: ${response.status}`);
    }

    const result = await response.json();
    const newPoints = JSON.parse(result.choices[0].message.content);

    return {
      pros: [...new Set([...currentAnalysis.pros, ...newPoints.pros])],
      cons: [...new Set([...currentAnalysis.cons, ...newPoints.cons])],
      sourcesAnalyzed: currentAnalysis.sourcesAnalyzed
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to analyze content with OpenAI');
  }
}


async function summarizePoints(points, type) {
  const API_KEY = 'YOUR-OPENAI-API-KEY';
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a product review summarizer. You must respond with a valid JSON array of strings only, without any markdown formatting or additional text. Example response: ["point 1", "point 2"]`
          },
          {
            role: "user",
            content: `Summarize these ${type} into a concise list. Combine similar points and remove redundancies. Keep the most important and unique points.\n\nPoints to summarize:\n${points.join('\n')}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned status: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    // Clean up the response before parsing
    let cleanContent = content
      .replace(/```json\s*/g, '')  // Remove ```json
      .replace(/```\s*/g, '')      // Remove closing ```
      .trim();                     // Remove extra whitespace
    
    try {
      return JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Parse error with content:', cleanContent);
      // Fallback parsing attempt if the response isn't properly formatted
      if (cleanContent.includes('[') && cleanContent.includes(']')) {
        cleanContent = cleanContent.substring(
          cleanContent.indexOf('['),
          cleanContent.lastIndexOf(']') + 1
        );
        return JSON.parse(cleanContent);
      }
      throw new Error('Failed to parse summarized points');
    }
  } catch (error) {
    console.error('Summarization Error:', error);
    throw new Error('Failed to summarize points: ' + error.message);
  }
}

