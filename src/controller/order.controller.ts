import {
  Body,
  Param,
  Controller, Request, HttpException, HttpStatus, Post, Put, UploadedFile, UseGuards, UseInterceptors,
  Delete,
  Get,
  Query,
  NotFoundException,
  Req
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
import { CustomLogger } from "src/logger/logger.service";



@Controller('orders')
export class OrderController {
  constructor(private OrderService: OrderService,
    private readonly logger: CustomLogger,

  ) { }

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
      this.logger.error('Error fetching orders:', error);
      return [];
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrderById(@Param('id') id: number): Promise<Order> {
    const order = await this.OrderService.findOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  //delete Order
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteOrder(
    @Param('id') id: number): Promise<void> {
    await this.OrderService.deleteOrder(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('')
  public async DeleteAllOrder(@Req() req: Request) {
    try {
      return await this.OrderService.DeleteAllOrder();
    } catch (error) {
      // throw ErrorHandlerHelper.errorHandler(error, req);
    }
  }


  @UseGuards(JwtAuthGuard)
  @Delete('')
  async deleteOrderNotification(
    @Param('id') id: number): Promise<void> {
    await this.OrderService.deleteOrderAndRelatedNotifications(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('')
  public async deleteAllOrderNotifications(@Req() req: Request) {
    try {
      await this.OrderService.deleteAllOrderNotifications();
      return { message: 'All notifications and orders deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting all notifications and orders:', error);
      throw new Error('Failed to delete notifications and orders');
    }
  }

}