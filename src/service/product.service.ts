import {

    Injectable,
    NotFoundException,

} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from 'src/product.entity';
import { CartItem } from 'src/cart-item.entity';

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    ) { }

    async createProduct(productData: Partial<Product>): Promise<Product> {
        const product = this.productRepository.create(productData);
        return await this.productRepository.save(product);
    }

    //update

    async updateProduct(id: number, updatedProductData: Partial<Product>): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        Object.assign(product, updatedProductData);
        return await this.productRepository.save(product);
    }

    //delete
    async deleteProduct(id: number): Promise<void> {
        try {
          // Delete related cart items first
          await this.cartItemRepository.createQueryBuilder()
            .delete()
            .where('productId = :id', { id })
            .execute();
    
          // Delete the product
          await this.productRepository.delete(id);
        } catch (error) {
         // console.error('Error deleting product:', error);
          throw new Error('Failed to delete product.');
        }
      }
    

    //fetch all products
    async getAllProducts(): Promise<Product[]> {
        return await this.productRepository.find();
    }

    //get ProductsdetailsbyId
    async getProductDetailsById(id: number): Promise<Product> {
        return await this.productRepository.findOne({ where: { id } });
    }

      
}