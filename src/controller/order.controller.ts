import {
  Body,
  Param,
  Controller, Request, HttpException, HttpStatus, Post, Put, UploadedFile, UseGuards, UseInterceptors,
  Delete,
  Get,
  Query
} from "@nestjs/common";
import { JwtAuthGuard } from "src/jwtGuard/jwt-auth.guard";
import { ProductService } from "src/service/product.service";
import { multerOptions } from '../multerOptions';
import { Product } from "src/product.entity";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from 'express';
import { OrderService } from "src/service/order.service";
import { Order } from "src/order.entity";
import { CartItem } from "src/cart-item.entity";



@Controller('orders')
export class OrderController {
  constructor(private OrderService: OrderService) { }

  @UseGuards(JwtAuthGuard)
  @Post('global')
  async createOrder(@Request() req,
    @Body() orderData: Partial<Order>
  ): Promise<Order> {
    const userId = (req.user as { userId: number }).userId;
    return await this.OrderService.globalOrder(userId, orderData);
  }


  @UseGuards(JwtAuthGuard)
  @Post('single')
  async orderSingle(@Request() req, @Body() orderData: Partial<Order>, @Query('itemId') itemId?: number) {
    const userId = (req.user as { userId: number }).userId;
    try {
      const order = await this.OrderService.orderSingle(userId, orderData, itemId);
      return order;
    } catch (error) {
      throw error;
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('fetchOrders')
  async fetchOrder() {
    try {
      const orders = await this.OrderService.getAllOrders();
      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  //delete Product
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteOrder(
      @Param('id') id: number): Promise<void> {
      await this.OrderService.deleteOrder(id);
  }

}