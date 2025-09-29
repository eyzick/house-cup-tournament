# Harry Potter House Cup Tournament

A magical live scoring system for your Harry Potter themed Halloween party! Track points for all four Hogwarts houses with real-time updates.

## Features

- 🏆 **Live House Cup Display** - Beautiful visual display of current scores
- ⚙️ **Admin Interface** - Add/remove points from your phone
- 🔄 **Real-time Updates** - Points sync instantly across devices
- 🎨 **Harry Potter Styling** - Magical themed design with authentic colors
- 📱 **Mobile Friendly** - Works perfectly on phones and monitors

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up JSONBin (for data storage):**
   - Go to [JSONBin.io](https://jsonbin.io/) and create a free account
   - Create a new bin
   - Copy your API key and Bin ID
   - Create a `.env` file in the project root:
     ```
     REACT_APP_JSONBIN_API_KEY=your_api_key_here
     REACT_APP_JSONBIN_BIN_ID=your_bin_id_here
     ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Usage

### Viewing Live Scores (Monitor Display)
- The main page shows all four houses with their current points
- Updates automatically every 2 seconds
- Perfect for displaying on a TV or monitor

### Admin Access (For Managing Points)
- **Option 1:** Click the ⚙️ button in the bottom right
- **Option 2:** Use keyboard shortcut: `Ctrl+Shift+A`
- **Option 3:** Add `?admin=true` to the URL
- **Password:** `avada kedavra` or `admin123` (you can change this in `src/App.tsx`)

### Managing Points
- **Quick Actions:** Pre-set buttons for +10, +25, +50, +100 points
- **Manual Entry:** Specify exact points and add reasoning
- **Reset All:** Returns all houses to 0 points
- **Current Scores:** See all current standings

## House Colors & Symbols

- 🦁 **Gryffindor** - Red (#740001)
- 🐍 **Slytherin** - Green (#1e4d13) 
- 🦡 **Hufflepuff** - Yellow (#ecb939)
- 🦅 **Ravenclaw** - Blue (#0e1a40)

## Party Setup Tips

### For the Host (Mobile Admin)
1. Bookmark the admin URL with `?admin=true`
2. Keep your phone handy to award points throughout the night
3. Use the quick action buttons for common point values
4. Add custom reasons for extra magic!

### For Display (Monitor/TV)
1. Open the site on a computer/TV browser in fullscreen
2. Navigate to `http://localhost:3000`
3. Press F11 for fullscreen mode
4. The display will auto-refresh every 2 seconds

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Customization

### Change Admin Password
Edit `src/App.tsx` line 36:
```typescript
if (enteredPassword === 'your_new_password') {
```

### Change Update Frequency
Edit `src/services/dataService.ts` line 169:
```typescript
intervalMs: number = 2000  // Change to desired milliseconds
```

### Modify House Colors/Names
Edit `src/types/index.ts` for customizations.

## Troubleshooting

**"API not configured" Error:**
- Make sure your `.env` file has the correct JSONBin credentials
- Restart the development server after adding environment variables

**Points Not Updating:**
- Check your internet connection
- Verify JSONBin credentials are correct
- Check browser console for errors

**Admin Panel Won't Open:**
- Try the keyboard shortcut: `Ctrl+Shift+A`
- Make sure you're using the correct password
- Try refreshing the page

## Tech Stack

- React with TypeScript
- JSONBin for data persistence
- Radix UI for icons
- CSS gradients and animations for magical effects

---

**Happy Halloween and may the best house win!** 🧙‍♀️✨