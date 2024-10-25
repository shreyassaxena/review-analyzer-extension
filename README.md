# Product Review Analyzer Chrome Extension

A Chrome extension that helps users make informed decisions by analyzing product reviews across multiple websites. The extension uses OpenAI's GPT API to process review content and maintain a cumulative list of pros and cons.

## Features

- Analyzes product reviews from any webpage
- Maintains a running list of pros and cons
- Summarizes and deduplicates points for clarity
- Uses OpenAI's GPT-3.5 for intelligent analysis

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/review-analyzer-extension.git
```

2. Install dependencies (if any):
```bash
npm install
```

3. Add your OpenAI API key in background.js (TODO: need to fetch this in a more
   systematic/ secure manner)

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `src` directory from this project

## Usage

1. Navigate to a product review page
2. Click the extension icon
3. Click "Analyze This Page"
4. View the accumulated pros and cons
5. Use the "Summarize" buttons to compress similar points

## Configuration

The extension requires an OpenAI API key to function. You can get one from [OpenAI's website](https://platform.openai.com/api-keys).

## Development

To modify or enhance the extension:

1. Make changes to files in the `src` directory
2. Reload the extension in Chrome
3. Test your changes

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

- OpenAI GPT API for text analysis
- JinaAI's reader API for content processing
