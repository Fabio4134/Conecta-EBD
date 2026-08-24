import cv2
import numpy as np
import sys

def remove_background(input_path, output_path):
    print(f"Lendo imagem: {input_path}")
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    
    if img is None:
        print("Erro: Não foi possível carregar a imagem.")
        sys.exit(1)
        
    print(f"Shape original: {img.shape}")
    
    # Adicionar canal alfa se não existir
    if img.shape[2] == 3:
        b, g, r = cv2.split(img)
        alpha = np.ones(b.shape, dtype=b.dtype) * 255
        img = cv2.merge((b, g, r, alpha))
        print("Canal alpha adicionado.")

    # Converter para escala de cinza
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Criar uma máscara onde o branco (fundo) é 255 e o resto é 0
    # Ajustando o threshold para pegar tons de branco/cinza muito claro
    _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
    
    # Inverter a máscara (fundo = 0, objeto = 255)
    mask_inv = cv2.bitwise_not(mask)
    
    # Opcional: Aplicar um pequeno blur/morfologia para suavizar as bordas
    kernel = np.ones((3,3), np.uint8)
    mask_inv = cv2.morphologyEx(mask_inv, cv2.MORPH_OPEN, kernel, iterations=1)
    # Suavizar as bordas do logo
    mask_inv = cv2.GaussianBlur(mask_inv, (3,3), 0)
    
    # Definir o canal alfa usando a máscara
    # Onde a máscara invertida é 0 (fundo branco original), a imagem ficará transparente (0)
    b, g, r, a = cv2.split(img)
    a = cv2.bitwise_and(a, a, mask=mask_inv)
    
    result = cv2.merge((b, g, r, a))
    
    # Salvar o resultado
    cv2.imwrite(output_path, result)
    print(f"Imagem salva como: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python remove_bg.py <input.jpg> <output.png>")
        sys.exit(1)
        
    in_file = sys.argv[1]
    out_file = sys.argv[2]
    remove_background(in_file, out_file)
