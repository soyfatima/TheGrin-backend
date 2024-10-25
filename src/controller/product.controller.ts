import {
    Body,
    Param,
    Controller, HttpException, HttpStatus, Post, Put, UploadedFile, UseGuards, UseInterceptors,
    Delete,
    Get,
    Patch
} from "@nestjs/common";
import { JwtAuthGuard } from "src/jwtGuard/jwt-auth.guard";
import { ProductService } from "src/service/product.service";
import { multerOptions } from '../multerOptions';
import { Product } from "src/product.entity";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from 'express';
import { ProdFileOptions } from "src/prodFileOption";
import { CustomLogger } from "src/logger/logger.service";



@Controller('products')
export class ProductController {
    constructor(private ProductService: ProductService,
    private readonly logger: CustomLogger,

    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('create')
    @UseInterceptors(FileInterceptor('uploadedFile', ProdFileOptions))
    async createProduct(
      @UploadedFile() file,
      @Body() productData: Partial<Product>,
    ) {
      try {
        if (productData.sizes) {
          productData.sizes = JSON.parse(productData.sizes as any);
        }
  
        const product = await this.ProductService.createProduct({
          ...productData,
          uploadedFile: file.filename,
        });
  
        return product;
      } catch (error) {
        throw new HttpException(
          'Failed to create product',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  

    //update Product
    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async updateFolder(
        @Param('id') id: number,
        @Body() updatedProductData: Partial<Product>,
    ): Promise<Product> {
        return await this.ProductService.updateProduct(id, updatedProductData);
    }

    //delete Product
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteProduct(
        @Param('id') id: number): Promise<void> {
        await this.ProductService.deleteProduct(id);
    }

    //get productdetails by id
    @Get('getproductdetails/:id')
    async getProductDetailsById(@Param('id') id: number): Promise<Product> {
        return await this.ProductService.getProductDetailsById(id);
    }

    //fetch folder
    @Get('fetchproduct')
    async getAllProduct(): Promise<Product[]> {
        return await this.ProductService.getAllProducts();
    }

    //update all products remise
  @Patch('update/remise')
  @UseGuards(JwtAuthGuard)
  async updateRemiseForAllProducts(@Body('remise') remise: string): Promise<{ message: string }> {
    await this.ProductService.updateRemiseForAllProducts(remise);
    return { message: 'Remise updated for all products successfully' };
  }
}