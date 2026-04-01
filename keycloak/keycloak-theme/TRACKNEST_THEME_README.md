# TrackNest Custom Keycloak Theme

This directory contains a fully customized Keycloak theme that matches the TrackNest application's design system and branding.

## 🎨 Theme Features

### ✅ **Completed Customizations**

1. **Color Palette Integration**
   - Imported complete color scheme from `@frontend/TrackNest/styles/styles.ts`
   - Primary color: `#74becb` (TrackNest teal)
   - Secondary colors and semantic colors (success, warning, error, info)
   - Neutral colors and background colors

2. **Branding Elements**
   - TrackNest logo integration from app assets
   - Custom "TrackNest" branding text
   - Favicon and icon integration

3. **Modern UI Design**
   - Clean, modern login form with rounded corners
   - Gradient backgrounds and hover effects
   - Smooth transitions and animations
   - Mobile-responsive design

4. **Component Styling**
   - Custom login form with TrackNest colors
   - Styled input fields with focus states
   - Primary button with gradient and hover effects
   - Alert messages with semantic colors
   - Social login provider styling

## 📁 File Structure

```
keycloak-theme/
├── src/
│   └── login/
│       ├── Template.tsx           # Custom template with TrackNest branding
│       ├── KcPage.tsx            # Updated to use custom components
│       ├── tracknest-theme.css   # Complete CSS with TrackNest colors
│       └── pages/
│           └── Login.tsx         # Custom login page component
├── public/
│   ├── tracknest-logo.png       # TrackNest favicon (48x48)
│   └── tracknest-icon.png       # TrackNest app icon (1024x1024)
└── vite.config.ts               # Configured with theme name "tracknest"
```

## 🎨 Design System

### Color Variables (CSS Custom Properties)
```css
:root {
  /* Primary colors from TrackNest palette */
  --tracknest-primary: #74becb;
  --tracknest-primary-dark: #5aa8b5;
  --tracknest-primary-light: #a8d8e0;
  --tracknest-primary-muted: #e0f2f5;
  
  /* Secondary/accent colors */
  --tracknest-secondary: #5b9aa6;
  --tracknest-accent: #4a8a96;
  
  /* Semantic colors */
  --tracknest-danger: #e74c3c;
  --tracknest-success: #27ae60;
  --tracknest-warn: #f39c12;
  --tracknest-info: #74becb;
  
  /* Typography */
  --tracknest-text-primary: #1a1a1a;
  --tracknest-text-secondary: #6b7280;
  --tracknest-text-muted: #9ca3af;
  
  /* Spacing and borders */
  --tracknest-spacing-xs: 6px;
  --tracknest-spacing-sm: 8px;
  --tracknest-spacing-md: 12px;
  --tracknest-spacing-lg: 16px;
  --tracknest-spacing-xl: 24px;
  
  --tracknest-radius-sm: 8px;
  --tracknest-radius-md: 12px;
  --tracknest-radius-lg: 18px;
}
```

### Key Design Elements
- **Gradient Background**: Subtle gradient from `--tracknest-primary-muted` to white
- **Card Design**: Login form in elevated white card with shadow
- **Button Styling**: Gradient primary buttons with hover animations
- **Input Fields**: Clean borders with focus states matching primary color
- **Typography**: Modern sans-serif font stack

## 🚀 Development & Testing

### Prerequisites
```bash
cd keycloak/keycloak-theme
npm install  # or yarn install
```

### Development Mode
To test the theme in development mode:
```bash
npm run dev
```
This will start a development server at `http://localhost:5173` showing the login page.

### Building the Theme
```bash
npm run build-keycloak-theme
```
This builds the theme JAR file for deployment to Keycloak.

### Testing Different Pages
Modify `src/main.tsx` to test different Keycloak pages:
```typescript
// Uncomment and modify for testing
window.kcContext = getKcContextMock({
    pageId: "login.ftl",     // or "register.ftl", "error.ftl", etc.
    overrides: {}
});
```

## 🔧 Customization

### Adding New Pages
1. Create new page component in `src/login/pages/`
2. Add case to switch statement in `KcPage.tsx`
3. Apply consistent styling using CSS custom properties

### Modifying Colors
Update color variables in `tracknest-theme.css`:
```css
:root {
  --tracknest-primary: #your-color;
  /* Other color variables */
}
```

### Logo/Branding Changes
1. Replace images in `public/` directory
2. Update Template.tsx logo reference
3. Adjust CSS for logo sizing if needed

## 📱 Mobile Responsiveness

The theme includes responsive design:
```css
@media (max-width: 768px) {
  #kc-content-wrapper {
    margin: var(--tracknest-spacing-lg);
    padding: var(--tracknest-spacing-lg);
  }
  
  .tracknest-logo-img {
    width: 40px;
    height: 40px;
  }
}
```

## 🎯 Integration with Keycloak

### Deployment
1. Build the theme: `npm run build-keycloak-theme`
2. Copy the generated JAR to Keycloak's `providers/` directory
3. Restart Keycloak
4. Configure realm to use "tracknest" theme

### Theme Configuration
In Keycloak Admin Console:
1. Go to Realm Settings → Themes
2. Set Login Theme to "tracknest"
3. Save changes

## 🔍 Key Files Created/Modified

1. **`tracknest-theme.css`**: Complete CSS styling with TrackNest colors
2. **`Template.tsx`**: Custom template with branding and structure
3. **`Login.tsx`**: Custom login page component
4. **`KcPage.tsx`**: Updated to use custom components
5. **Logo Assets**: Copied TrackNest icons to public directory

## 🎨 Visual Features

- **Gradient Backgrounds**: Subtle gradients using TrackNest colors
- **Modern Card Design**: Elevated login form with rounded corners
- **Smooth Animations**: Hover effects and transitions
- **Consistent Typography**: Modern font stack with proper hierarchy
- **Accessible Design**: Proper focus states and color contrast
- **Brand Integration**: TrackNest logo and consistent color usage

## 🚦 Status: Ready for Production

All customizations are complete and ready for deployment. The theme successfully integrates TrackNest's design system while maintaining Keycloak's functionality and accessibility standards.