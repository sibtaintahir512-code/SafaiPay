import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    version_name: 'demo-v1',
    architecture: 'MobileNetV3-Small-FineTuned (Demo Interface)',
    classes: ['PET plastic', 'cardboard', 'other/unknown'],
    description: 'Baseline demonstration classifier for recyclable waste pre-screening in Pakistan.',
    accuracy: 0.912,
    precision: 0.905,
    recall: 0.898,
    f1_score: 0.901,
    is_active: true,
    evaluation_metrics_plan: {
      required_metrics: ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'Confusion Matrix'],
      confidence_threshold: 0.70,
      human_in_the_loop_fallback: true,
      target_environment: 'Karachi informal waste aggregation hubs'
    }
  });
}
