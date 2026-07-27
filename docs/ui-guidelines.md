# UI Guidelines

This document outlines the design standards and best practices for developing user interfaces in this project.

## Theme

The application uses a **dark theme** to provide a modern, accessible visual experience suitable for extended use.

### Color Palette

All UI components should adhere to the following color scheme:

| Component | Hex Code | Color Name | Usage |
|-----------|----------|-----------|-------|
| Primary Background | `#0D0D0D` | Deep Void | Main app background, page backgrounds |
| Elevated Surfaces | `#1A1A1A` | Dark Charcoal | Cards, modals, panels, elevated elements |
| Primary Text | `#FFFFFF` | Pure White | Main text content, headings |
| Secondary Text | `#A0AFB5` | Muted Silver | Helper text, descriptions, disabled states |
| Accent/CTA | `#00FF85` | Neon Mint | Primary action buttons, important highlights |
| Secondary Accent | `#1E90FF` | Electric Blue | Secondary actions, links, informational elements |

### Color Usage Guidelines

- **Primary Background (`#0D0D0D`)**: Use as the base background for all pages and the main application container
- **Elevated Surfaces (`#1A1A1A`)**: Apply to cards, modals, dropdown menus, and any elements that should appear "raised" above the background
- **Primary Text (`#FFFFFF`)**: Use for all main headings, body text, and primary content
- **Secondary Text (`#A0AFB5`)**: Use for subheadings, help text, placeholders, disabled buttons, and metadata
- **Accent/CTA (`#00FF85`)**: Reserve for primary call-to-action buttons, key interactive elements, and important highlights
- **Secondary Accent (`#1E90FF`)**: Use for secondary buttons, links, informational alerts, and supporting interactive elements

## Responsive Design

The UI must be optimized for both mobile and desktop devices.

### Mobile (Portrait)
- **Viewport width**: 320px - 480px
- **Layout**: Single column layout, stacked elements
- **Typography**: Appropriately scaled for touch targets (minimum 44px height for interactive elements)
- **Spacing**: Increased padding on edges to accommodate touch interactions
- **Navigation**: Mobile-friendly menu systems, bottom navigation or hamburger menus

### Tablet (Landscape & Portrait)
- **Viewport width**: 481px - 1024px
- **Layout**: Flexible grid system, may use 2-column layouts where appropriate
- **Typography**: Balanced scaling between mobile and desktop
- **Spacing**: Medium padding, optimized for both touch and mouse interaction

### Desktop
- **Viewport width**: 1025px and above
- **Layout**: Multi-column layouts, full utilization of horizontal space
- **Typography**: Standard desktop scaling
- **Spacing**: Generous padding and margins for visual hierarchy
- **Interactions**: Full support for hover states, cursor feedback, and complex UI patterns

### Responsive Implementation Best Practices

1. **Mobile-First Approach**: Design and implement for mobile devices first, then enhance for larger screens
2. **Breakpoints**: Use consistent breakpoints across the application:
   - Small (sm): 480px
   - Medium (md): 768px
   - Large (lg): 1024px
   - Extra Large (xl): 1280px

3. **Flexible Components**: Ensure all components scale gracefully between screen sizes
4. **Touch Targets**: Maintain minimum 44px × 44px touch targets on mobile devices
5. **Performance**: Optimize images and assets for mobile devices to ensure fast load times
6. **Testing**: Test UI on actual devices and using browser developer tools to verify responsive behavior

## Component Standards

- All interactive elements should have clear hover and active states
- Maintain consistent spacing and alignment throughout the application
- Use the accent colors sparingly to draw attention to important actions
- Ensure sufficient contrast between text and backgrounds for accessibility (WCAG AA compliance recommended)
- Buttons should include clear visual feedback for user interactions (hover, active, disabled states)
- Forms should provide clear labels, error messages, and validation feedback
