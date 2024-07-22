import { Controller, Get, Post, Request, Param, Body, ParseIntPipe, Put, Delete, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { CartService } from 'src/service/cart.service';
import { Cart } from 'src/cart.entity';
import { JwtAuthGuard } from 'src/jwtGuard/jwt-auth.guard';
import { CartItem } from 'src/cart-item.entity';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  //user cart
  @UseGuards(JwtAuthGuard)
  @Get('userCart')
  async getUserCart(@Request() req) {
    const userId = (req.user as { userId: number }).userId;
    const cart = await this.cartService.getUserCart(userId);
    return cart;
  }
  //add item with quantity select to cart
  @UseGuards(JwtAuthGuard)
  @Post('addToCartWithQuantity')
  async addToCartWithQuantity(@Request() req, @Body() body) {
    const userId = (req.user as { userId: number }).userId;
    const { productId, quantity } = body;
    try {
      return await this.cartService.addToCartWithQuantity(userId, productId, quantity);
    } catch (error) {
      if (error.message === 'Item already in cart') {
        throw new HttpException('Item already in cart', HttpStatus.CONFLICT);
      } else if (error.message === 'Product not found') {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      } else {
        throw new HttpException('Failed to add product to cart', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  
  //add item to cart
  @UseGuards(JwtAuthGuard)
  @Post('addToCart')
  async addToCart1(@Request() req, @Body('productId') productId: number) {
    const userId = (req.user as { userId: number }).userId;
    try {
      return await this.cartService.addToCart1(userId, productId);
    } catch (error) {
      if (error.message === 'Item already in cart') {
        throw new HttpException('Item already in cart', HttpStatus.CONFLICT);
      } else if (error.message === 'Product not found') {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      } else {
        throw new HttpException('Failed to add product to cart', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  // get cart totalprice before order
  @UseGuards(JwtAuthGuard)
  @Post('getTotalCartPrice')
  async processPayment(@Request() req) {
    const userId = (req.user as { userId: number }).userId;
    const { totalPrice, totalQuantity } = await this.cartService.getTotalCartPrice(userId);
    return { totalPrice, totalQuantity };
  }

  //remove cartItem from cart
  @UseGuards(JwtAuthGuard)
  @Delete('remove/:productId')
  async removeFromCart(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<Cart> {
    const userId = (req.user as { userId: number }).userId;
    return await this.cartService.removeFromCart(userId, productId);
  }
  
  //update cartItem
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateCartItem(@Request() req, @Param('id') id: number, @Body() updateData: Partial<CartItem>) {
    const userId = (req.user as { userId: number }).userId;
    return this.cartService.updateCartItem(userId, id, updateData);
  }
  //update cartItem from cart
  @UseGuards(JwtAuthGuard)
  @Put('cart/:id')
  async updateCartItemFromCart(@Request() req, @Param('id') id: number, @Body() updateData: Partial<CartItem>) {
    const userId = (req.user as { userId: number }).userId;
    return this.cartService.updateCartItemFromCart(userId, id, updateData);
  }
  
  //get single item price
  @UseGuards(JwtAuthGuard)
  @Get('item/:itemId')
  async getSingleItemPrice(
    @Request() req,
    @Param('itemId') itemId: number,
  ) {
    const userId = (req.user as { userId: number }).userId;
    const { totalPrice, totalQuantity } = await this.cartService.getSingleItemPrice(userId, itemId);
    return { totalPrice, totalQuantity };
  }

  // @UseGuards(JwtAuthGuard)
  // @Get('product/:productId')
  // async getItemPrice(
  //   @Request() req,
  //   @Param('productId') productId: number,
  // ) {
  //   const userId = (req.user as { userId: number }).userId;
  //   const { totalPrice, totalQuantity } = await this.cartService.getItemPrice(userId, productId);
  //   return { totalPrice, totalQuantity };
  // }

}
