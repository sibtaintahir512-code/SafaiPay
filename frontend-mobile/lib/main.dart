import 'package:flutter/material.dart';

void main() {
  runApp(const SafaiPayApp());
}

/// Official SafaiPay Design System Tokens
class SafaiPayColors {
  // Light Mode Tokens
  static const Color lightBg = Color(0xFFF4F8F5);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightElevated = Color(0xFFFFFFFF);
  static const Color lightDeepGreen = Color(0xFF073D3B);
  static const Color lightPrimary = Color(0xFF16865F);
  static const Color lightBrightGreen = Color(0xFF35B889);
  static const Color lightText = Color(0xFF0B3D3B);
  static const Color lightSecondaryText = Color(0xFF6B817C);
  static const Color lightBorder = Color(0xFFD7E8E1);
  static const Color lightSoftMint = Color(0xFFE1F4EB);
  static const Color lightBrightMint = Color(0xFF9EE3C4);
  static const Color lightYellow = Color(0xFFF4B400);
  static const Color lightError = Color(0xFFD64545);

  // Dark Mode Tokens
  static const Color darkBg = Color(0xFF071F1F);
  static const Color darkSurface = Color(0xFF0D3030);
  static const Color darkElevated = Color(0xFF123D3B);
  static const Color darkDeepGreen = Color(0xFF061A1A);
  static const Color darkPrimary = Color(0xFF35B889);
  static const Color darkBrightGreen = Color(0xFF65D7AE);
  static const Color darkText = Color(0xFFF4FAF7);
  static const Color darkSecondaryText = Color(0xFFA9C2B9);
  static const Color darkBorder = Color(0xFF24514D);
  static const Color darkSoftMint = Color(0xFF173F3C);
  static const Color darkBrightMint = Color(0xFF9EE3C4);
  static const Color darkYellow = Color(0xFFF4B400);
  static const Color darkError = Color(0xFFFF8B8B);
}

class SafaiPayApp extends StatefulWidget {
  const SafaiPayApp({super.key});

  @override
  State<SafaiPayApp> createState() => _SafaiPayAppState();
}

class _SafaiPayAppState extends State<SafaiPayApp> {
  ThemeMode _themeMode = ThemeMode.system;

  void _updateTheme(ThemeMode mode) {
    setState(() {
      _themeMode = mode;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SafaiPay',
      debugShowCheckedModeBanner: false,
      themeMode: _themeMode,

      // Light Theme Definition
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: SafaiPayColors.lightBg,
        primaryColor: SafaiPayColors.lightPrimary,
        colorScheme: const ColorScheme.light(
          primary: SafaiPayColors.lightPrimary,
          secondary: SafaiPayColors.lightBrightGreen,
          surface: SafaiPayColors.lightSurface,
          error: SafaiPayColors.lightError,
          onPrimary: Colors.white,
          onSurface: SafaiPayColors.lightText,
        ),
        cardTheme: const CardThemeData(
          color: SafaiPayColors.lightSurface,
          elevation: 1,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            side: BorderSide(color: SafaiPayColors.lightBorder),
            borderRadius: BorderRadius.all(Radius.circular(20)),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: SafaiPayColors.lightPrimary,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(52),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
        ),
      ),

      // Dark Theme Definition
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: SafaiPayColors.darkBg,
        primaryColor: SafaiPayColors.darkPrimary,
        colorScheme: const ColorScheme.dark(
          primary: SafaiPayColors.darkPrimary,
          secondary: SafaiPayColors.darkBrightGreen,
          surface: SafaiPayColors.darkSurface,
          error: SafaiPayColors.darkError,
          onPrimary: SafaiPayColors.darkDeepGreen,
          onSurface: SafaiPayColors.darkText,
        ),
        cardTheme: const CardThemeData(
          color: SafaiPayColors.darkSurface,
          elevation: 2,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            side: BorderSide(color: SafaiPayColors.darkBorder),
            borderRadius: BorderRadius.all(Radius.circular(20)),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: SafaiPayColors.darkPrimary,
            foregroundColor: SafaiPayColors.darkDeepGreen,
            minimumSize: const Size.fromHeight(52),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
        ),
      ),

      home: SafaiPayHomeScreen(
        currentTheme: _themeMode,
        onThemeChanged: _updateTheme,
      ),
    );
  }
}

class SafaiPayHomeScreen extends StatelessWidget {
  final ThemeMode currentTheme;
  final ValueChanged<ThemeMode> onThemeChanged;

  const SafaiPayHomeScreen({
    super.key,
    required this.currentTheme,
    required this.onThemeChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? SafaiPayColors.darkElevated : SafaiPayColors.lightSoftMint,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.recycling_rounded,
                color: isDark ? SafaiPayColors.darkPrimary : SafaiPayColors.lightPrimary,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'SafaiPay',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                color: isDark ? SafaiPayColors.darkText : SafaiPayColors.lightText,
                letterSpacing: -0.5,
              ),
            ),
          ],
        ),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Theme Selector Segmented Control Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Appearance Mode',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: isDark ? SafaiPayColors.darkText : SafaiPayColors.lightText,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: isDark ? SafaiPayColors.darkSoftMint : SafaiPayColors.lightSoftMint,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              currentTheme == ThemeMode.system
                                  ? 'SYSTEM'
                                  : (currentTheme == ThemeMode.dark ? 'DARK' : 'LIGHT'),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: isDark ? SafaiPayColors.darkPrimary : SafaiPayColors.lightPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SegmentedButton<ThemeMode>(
                        segments: const [
                          ButtonSegment(
                            value: ThemeMode.light,
                            icon: Icon(Icons.wb_sunny_rounded, size: 18),
                            label: Text('Light'),
                          ),
                          ButtonSegment(
                            value: ThemeMode.dark,
                            icon: Icon(Icons.nightlight_round, size: 18),
                            label: Text('Dark'),
                          ),
                          ButtonSegment(
                            value: ThemeMode.system,
                            icon: Icon(Icons.settings_brightness_rounded, size: 18),
                            label: Text('System'),
                          ),
                        ],
                        selected: {currentTheme},
                        onSelectionChanged: (Set<ThemeMode> newSelection) {
                          onThemeChanged(newSelection.first);
                        },
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Circular Orbit Mobile Representation
              Container(
                height: 220,
                decoration: BoxDecoration(
                  color: isDark ? SafaiPayColors.darkSurface : SafaiPayColors.lightSurface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isDark ? SafaiPayColors.darkBorder : SafaiPayColors.lightBorder,
                  ),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer Ring
                    Container(
                      width: 170,
                      height: 170,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: (isDark ? SafaiPayColors.darkBrightGreen : SafaiPayColors.lightBrightGreen)
                              .withOpacity(0.3),
                          width: 2,
                        ),
                      ),
                    ),
                    // Orbit Icon Center
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: isDark ? SafaiPayColors.darkElevated : SafaiPayColors.lightSoftMint,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: SafaiPayColors.lightYellow.withOpacity(0.2),
                            blurRadius: 20,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.recycling_rounded,
                        color: isDark ? SafaiPayColors.darkPrimary : SafaiPayColors.lightPrimary,
                        size: 38,
                      ),
                    ),
                    // Orbit Badge: AI
                    Positioned(
                      top: 24,
                      right: 36,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isDark ? SafaiPayColors.darkElevated : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark ? SafaiPayColors.darkPrimary : SafaiPayColors.lightPrimary,
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.auto_awesome, size: 12, color: SafaiPayColors.lightYellow),
                            SizedBox(width: 4),
                            Text('AI Validated', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                    // Orbit Badge: Scale KG
                    Positioned(
                      bottom: 24,
                      left: 36,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isDark ? SafaiPayColors.darkElevated : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: SafaiPayColors.lightYellow),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.scale_rounded, size: 12, color: SafaiPayColors.lightYellow),
                            SizedBox(width: 4),
                            Text('Scale KG', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Action Buttons
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add_shopping_cart_rounded),
                label: const Text('Book Household Pickup'),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  side: BorderSide(
                    color: isDark ? SafaiPayColors.darkBorder : SafaiPayColors.lightBorder,
                  ),
                ),
                icon: const Icon(Icons.qr_code_scanner_rounded),
                label: const Text('Scan Scale QR Code'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
