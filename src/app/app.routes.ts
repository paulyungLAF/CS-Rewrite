import { Routes } from '@angular/router';
import { DomSummaryComponent } from './features/dom-summary/dom-summary.component';
import { FulfillerItemsComponent } from './features/fulfiller-items/fulfiller-items.component';
import { CloseItemsComponent } from './features/close-items/close-items.component';
import { MyItemsComponent } from './features/my-items/my-items.component';
import { OrderListComponent } from './features/order-list/order-list.component';
import { SearchComponent } from './features/search/search.component';
import { VendorComponent } from './features/vendor/vendor.component';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

export const routes: Routes = [
	{
		path: '',
		component: AppShellComponent,
		children: [
			{ path: '', redirectTo: 'home', pathMatch: 'full' },
			{ path: 'home', component: DomSummaryComponent },
			{ path: 'fulfiller-items', component: FulfillerItemsComponent },
			{ path: 'my-items', component: MyItemsComponent },
			{ path: 'close-items', component: CloseItemsComponent },
			{ path: 'order-list', component: OrderListComponent },
			{ path: 'search', component: SearchComponent },
			{ path: 'vendor', component: VendorComponent }
		]
	},
	{ path: '**', redirectTo: '' }
];