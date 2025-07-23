import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  let tempImagePath: string | null = null;
  
  try {
    const { imageData } = await request.json();
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'No se proporcionaron datos de imagen.' }, 
        { status: 400 }
      );
    }

    // Validate base64 image data
    if (!imageData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Formato de imagen inválido. Se requiere una imagen válida en base64.' }, 
        { status: 400 }
      );
    }

    // Extract base64 data and determine file extension
    const matches = imageData.match(/^data:image\/([a-zA-Z]*);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json(
        { error: 'Formato de imagen base64 inválido.' }, 
        { status: 400 }
      );
    }

    const imageType = matches[1];
    const base64Data = matches[2];
    
    // Create temporary file for the image
    const tempId = randomUUID();
    tempImagePath = path.join('/tmp', `fashionmnist_input_${tempId}.${imageType}`);
    
    // Write image to temporary file
    await writeFile(tempImagePath, base64Data, 'base64');

    // TODO: Replace this section with your actual C++ FashionMNIST model inference
    // Example of how you might call your C++ inference binary:
    /*
    const modelPath = '/path/to/your/fashionmnist_model.bin';
    const inferenceResult = await runCppInference(modelPath, tempImagePath, 'fashionmnist');
    */

    // For now, we'll simulate the inference with a random prediction
    const simulatedPrediction = await simulateFashionMNISTInference();
    
    return NextResponse.json({
      prediction: simulatedPrediction.fashionItem,
      confidence: simulatedPrediction.confidence
    });
    
  } catch (error: any) {
    console.error('Error en la API de predicción FashionMNIST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' }, 
      { status: 500 }
    );
  } finally {
    // Clean up temporary file
    if (tempImagePath) {
      try {
        await unlink(tempImagePath);
      } catch (cleanupError) {
        console.warn('No se pudo eliminar el archivo temporal:', cleanupError);
      }
    }
  }
}

// Simulated FashionMNIST inference function - replace this with your actual model call
async function simulateFashionMNISTInference(): Promise<{ fashionItem: string; confidence: number }> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
  
  // Fashion items in FashionMNIST dataset
  const fashionItems = [
    'T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat',
    'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot'
  ];
  
  // Return random prediction for demonstration
  const fashionItem = fashionItems[Math.floor(Math.random() * fashionItems.length)];
  const confidence = 0.72 + Math.random() * 0.28; // Random confidence between 72-100%
  
  return { fashionItem, confidence };
}

// Example function for calling your C++ inference binary
// Uncomment and modify this when you're ready to integrate your actual FashionMNIST model
/*
async function runCppInference(modelPath: string, imagePath: string, dataset: string): Promise<{ fashionItem: string; confidence: number }> {
  return new Promise((resolve, reject) => {
    // Example command - adjust according to your C++ binary interface
    const child = spawn('./your_fashionmnist_inference_binary', [
      '--model', modelPath,
      '--input', imagePath,
      '--dataset', dataset,
      '--output', 'json'
    ]);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FashionMNIST inference failed with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Parse the output from your C++ binary
        // Adjust this according to your binary's output format
        const result = JSON.parse(stdout);
        resolve({
          fashionItem: result.predicted_fashion_item,
          confidence: result.confidence
        });
      } catch (parseError) {
        reject(new Error(`Failed to parse FashionMNIST inference result: ${parseError}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to start FashionMNIST inference process: ${error.message}`));
    });
  });
}
*/
