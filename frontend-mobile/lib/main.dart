import 'package:flutter/material.dart';

void main() {
  runApp(const SafaiPayApp());
}

class SafaiPayApp extends StatelessWidget {
  const SafaiPayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SafaiPay',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF10B981), // SafaiPay Emerald Green
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF10B981),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.recycling, size: 80, color: Color(0xFF10B981)),
              SizedBox(height: 16),
              Text(
                'SafaiPay Mobile Foundation',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Text('Smart Waste Collection & Digital Earnings'),
            ],
          ),
        ),
      ),
    );
  }
}
