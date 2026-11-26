import { BoldIcon, ChevronRightIcon, FileTextIcon, InboxIcon, ItalicIcon, MailIcon, SearchIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { toast } from 'sonner';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { DESKTOP, describeVisual, MOBILE, type VisualSubject } from '../../../../test/visual';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { AspectRatio } from './aspect-ratio';
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from './attachment';
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from './avatar';
import { Badge } from './badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';
import { Bubble, BubbleContent, BubbleGroup } from './bubble';
import { ButtonGroup } from './button-group';
import { Button } from './button';
import { Calendar } from './calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './carousel';
import { ChartContainer } from './chart';
import { Checkbox } from './checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from './combobox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from './command';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from './context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from './field';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from './input-otp';
import { Input } from './input';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from './item';
import { Kbd, KbdGroup } from './kbd';
import { Label } from './label';
import { Marker, MarkerContent } from './marker';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from './menubar';
import { MessageScroller, MessageScrollerContent, MessageScrollerItem, MessageScrollerViewport } from './message-scroller';
import { Message, MessageAvatar, MessageContent, MessageGroup, MessageHeader } from './message';
import { NativeSelect, NativeSelectOption } from './native-select';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './navigation-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from './popover';
import { Progress } from './progress';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable';
import { ScrollArea } from './scroll-area';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './select';
import { Separator } from './separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar';
import { Skeleton } from './skeleton';
import { Slider } from './slider';
import { Toaster } from './sonner';
import { Spinner } from './spinner';
import { Switch } from './switch';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Textarea } from './textarea';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
import { Toggle } from './toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

const BOTH = [DESKTOP, MOBILE] as const;
const FRUITS = ['Apple', 'Banana', 'Cherry', 'Grape'];

/** Clicks the control named `name`, which opens the popup the capture shows. */
async function open(role: 'button' | 'combobox', name: string): Promise<undefined> {
  await userEvent.click(page.getByRole(role, { name }));
  return undefined;
}

/** Waits for the popup of `role` to be on the page, so the capture holds it. */
async function shown(role: 'dialog' | 'alertdialog' | 'menu' | 'listbox' | 'tooltip'): Promise<undefined> {
  await expect.element(page.getByRole(role).first()).toBeVisible();
  return undefined;
}

function Row({ children }: { children: ReactNode }): ReactNode {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

/** Each primitive's file, by the name it is captured under, with the parts and states it draws. */
const SUBJECTS = {
  accordion: {
    render: () => (
      <Accordion defaultValue={['shipping']} className="max-w-md">
        <AccordionItem value="shipping">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>Orders leave the warehouse within two working days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="returns">
          <AccordionTrigger>Returns</AccordionTrigger>
          <AccordionContent>Return anything within thirty days.</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  'alert-dialog': {
    window: true,
    widths: BOTH,
    render: () => (
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="outline" />}>Delete project</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>Its pages and their history are removed for everyone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    arrange: () => open('button', 'Delete project').then(() => shown('alertdialog')),
  },
  alert: {
    render: () => (
      <div className="grid max-w-md gap-3">
        <Alert>
          <MailIcon />
          <AlertTitle>Invite sent</AlertTitle>
          <AlertDescription>They can join once they open the link.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Payment failed</AlertTitle>
          <AlertDescription>The card was declined.</AlertDescription>
        </Alert>
      </div>
    ),
  },
  'aspect-ratio': {
    render: () => (
      <div className="w-72">
        <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg" />
      </div>
    ),
  },
  attachment: {
    render: () => (
      <AttachmentGroup>
        <Attachment>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>report.pdf</AttachmentTitle>
            <AttachmentDescription>2.4 MB</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment state="error">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>notes.txt</AttachmentTitle>
            <AttachmentDescription>Upload failed</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      </AttachmentGroup>
    ),
  },
  avatar: {
    render: () => (
      <Row>
        <Avatar>
          <AvatarImage src="https://images.test/portrait.png" alt="Ada" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar size="sm">
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>KJ</AvatarFallback>
        </Avatar>
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>CD</AvatarFallback>
          </Avatar>
        </AvatarGroup>
      </Row>
    ),
  },
  badge: {
    render: () => (
      <Row>
        {(['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const).map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </Row>
    ),
  },
  breadcrumb: {
    render: () => (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#home">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#docs">Docs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Button</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    ),
  },
  bubble: {
    render: () => (
      <BubbleGroup className="max-w-md">
        <Bubble>
          <BubbleContent>Is the build green?</BubbleContent>
        </Bubble>
        <Bubble align="end" variant="secondary">
          <BubbleContent>Yes, and deployed.</BubbleContent>
        </Bubble>
      </BubbleGroup>
    ),
  },
  'button-group': {
    render: () => (
      <ButtonGroup>
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Report</Button>
        <Button variant="outline">Snooze</Button>
      </ButtonGroup>
    ),
  },
  button: {
    render: () => (
      <div className="grid gap-3">
        <Row>
          {(['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const).map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </Row>
        <Row>
          {(['xs', 'sm', 'default', 'lg'] as const).map((size) => (
            <Button key={size} size={size}>
              {size}
            </Button>
          ))}
          {(['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const).map((size) => (
            <Button key={size} size={size} variant="outline" aria-label={size}>
              <SearchIcon />
            </Button>
          ))}
          <Button disabled>disabled</Button>
        </Row>
      </div>
    ),
  },
  calendar: {
    render: () => (
      <Calendar
        mode="single"
        selected={new Date(2026, 0, 15)}
        defaultMonth={new Date(2026, 0, 1)}
        className="rounded-lg border"
      />
    ),
  },
  card: {
    widths: BOTH,
    render: () => (
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>Billed monthly.</CardDescription>
        </CardHeader>
        <CardContent>Ten seats, unlimited projects.</CardContent>
        <CardFooter>
          <Button>Upgrade</Button>
        </CardFooter>
      </Card>
    ),
  },
  carousel: {
    render: () => (
      <Carousel className="mx-16 max-w-xs">
        <CarouselContent>
          {[1, 2, 3].map((slide) => (
            <CarouselItem key={slide}>
              <Card>
                <CardContent className="flex aspect-square items-center justify-center text-4xl">{slide}</CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    ),
  },
  chart: {
    render: () => (
      <ChartContainer config={{ visits: { label: 'Visits', color: 'var(--chart-1)' } }} className="h-48 w-full max-w-md">
        <BarChart
          data={[
            { month: 'Jan', visits: 186 },
            { month: 'Feb', visits: 305 },
            { month: 'Mar', visits: 237 },
          ]}
        >
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <Bar dataKey="visits" fill="var(--color-visits)" radius={4} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    ),
  },
  checkbox: {
    render: () => (
      <Row>
        <Checkbox aria-label="Off" />
        <Checkbox aria-label="On" defaultChecked />
        <Checkbox aria-label="Disabled" disabled />
      </Row>
    ),
  },
  collapsible: {
    render: () => (
      <Collapsible defaultOpen className="max-w-sm">
        <CollapsibleTrigger render={<Button variant="ghost" />}>Details</CollapsibleTrigger>
        <CollapsibleContent>Shipped from the north warehouse.</CollapsibleContent>
      </Collapsible>
    ),
  },
  combobox: {
    window: true,
    render: () => (
      <Combobox items={FRUITS}>
        <ComboboxInput placeholder="Pick a fruit" aria-label="Fruit" />
        <ComboboxContent>
          <ComboboxEmpty>No fruit found.</ComboboxEmpty>
          <ComboboxList>
            {(fruit: string) => (
              <ComboboxItem key={fruit} value={fruit}>
                {fruit}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ),
    arrange: () => open('combobox', 'Fruit').then(() => shown('listbox')),
  },
  command: {
    render: () => (
      <Command className="max-w-sm rounded-lg border">
        <CommandInput placeholder="Type a command" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              Calendar
              <CommandShortcut>Ctrl+C</CommandShortcut>
            </CommandItem>
            <CommandItem>Search</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    ),
  },
  'context-menu': {
    window: true,
    render: () => (
      <ContextMenu>
        <ContextMenuTrigger className="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed">
          Right-click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Back</ContextMenuItem>
          <ContextMenuItem>Reload</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
    arrange: async () => {
      await userEvent.click(page.getByText('Right-click here'), { button: 'right' });
      return shown('menu');
    },
  },
  dialog: {
    window: true,
    widths: BOTH,
    render: () => (
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>Edit profile</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Changes show on your next visit.</DialogDescription>
          </DialogHeader>
          <Input aria-label="Name" defaultValue="Ada Lovelace" />
          <DialogFooter>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
    arrange: () => open('button', 'Edit profile').then(() => shown('dialog')),
  },
  drawer: {
    window: true,
    widths: BOTH,
    render: () => (
      <Drawer>
        <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Move goal</DrawerTitle>
            <DrawerDescription>Set your daily activity goal.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>Submit</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    ),
    arrange: () => open('button', 'Open drawer').then(() => shown('dialog')),
  },
  'dropdown-menu': {
    window: true,
    render: () => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Account</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>Shift+Ctrl+P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    arrange: () => open('button', 'Account').then(() => shown('menu')),
  },
  empty: {
    widths: BOTH,
    render: () => (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>No messages</EmptyTitle>
          <EmptyDescription>New messages land here.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Compose</Button>
        </EmptyContent>
      </Empty>
    ),
  },
  field: {
    widths: BOTH,
    render: () => (
      <FieldSet className="max-w-xl">
        <FieldLegend>Contact</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="field-email">Email</FieldLabel>
            <Input id="field-email" defaultValue="ada@example.test" />
            <FieldDescription>Receipts go here.</FieldDescription>
          </Field>
          <Field orientation="responsive" data-invalid>
            <FieldLabel htmlFor="field-phone">Phone</FieldLabel>
            <Input id="field-phone" aria-invalid defaultValue="12" />
            <FieldError>Enter a full number.</FieldError>
          </Field>
        </FieldGroup>
      </FieldSet>
    ),
  },
  'hover-card': {
    window: true,
    render: () => (
      <HoverCard>
        <HoverCardTrigger href="#profile">@ada</HoverCardTrigger>
        <HoverCardContent>Mathematician, writer of the first program.</HoverCardContent>
      </HoverCard>
    ),
    arrange: async () => {
      await userEvent.hover(page.getByRole('link', { name: '@ada' }));
      await expect.element(page.getByText('Mathematician, writer of the first program.')).toBeVisible();
      return undefined;
    },
  },
  'input-group': {
    render: () => (
      <InputGroup className="max-w-sm">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search" aria-label="Search" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton>Go</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    ),
  },
  'input-otp': {
    render: () => (
      <InputOTP maxLength={6} defaultValue="123" aria-label="Code">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    ),
  },
  input: {
    render: () => (
      <div className="grid max-w-sm gap-3">
        <Input placeholder="Placeholder" aria-label="Empty" />
        <Input defaultValue="Filled" aria-label="Filled" />
        <Input defaultValue="Invalid" aria-invalid aria-label="Invalid" />
        <Input defaultValue="Disabled" disabled aria-label="Disabled" />
      </div>
    ),
  },
  item: {
    render: () => (
      <div className="grid max-w-md gap-3">
        {(['default', 'outline', 'muted'] as const).map((variant) => (
          <Item key={variant} variant={variant}>
            <ItemMedia variant="icon">
              <MailIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{variant}</ItemTitle>
              <ItemDescription>Three unread messages.</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant="outline">
                Open
              </Button>
            </ItemActions>
          </Item>
        ))}
      </div>
    ),
  },
  kbd: {
    render: () => (
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    ),
  },
  label: {
    render: () => (
      <div className="flex items-center gap-2">
        <Checkbox id="label-terms" />
        <Label htmlFor="label-terms">Accept the terms</Label>
      </div>
    ),
  },
  marker: {
    render: () => (
      <div className="grid max-w-md gap-4">
        {(['default', 'separator', 'border'] as const).map((variant) => (
          <Marker key={variant} variant={variant}>
            <MarkerContent>{variant}</MarkerContent>
          </Marker>
        ))}
      </div>
    ),
  },
  menubar: {
    window: true,
    render: () => (
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New tab <MenubarShortcut>Ctrl+T</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Print</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Undo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    ),
    arrange: async () => {
      await userEvent.click(page.getByRole('menuitem', { name: 'File' }));
      return shown('menu');
    },
  },
  'message-scroller': {
    render: () => (
      <MessageScroller className="h-48 max-w-md rounded-lg border">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            {['Morning', 'The build is green', 'Shipping now'].map((text) => (
              <MessageScrollerItem key={text}>{text}</MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>
    ),
  },
  message: {
    render: () => (
      <MessageGroup className="max-w-md">
        <Message>
          <MessageAvatar>
            <Avatar size="sm">
              <AvatarFallback>AL</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Ada</MessageHeader>
            <Bubble>
              <BubbleContent>Shall we ship it?</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageGroup>
    ),
  },
  'native-select': {
    render: () => (
      <NativeSelect aria-label="Fruit" defaultValue="Banana">
        {FRUITS.map((fruit) => (
          <NativeSelectOption key={fruit} value={fruit}>
            {fruit}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    ),
  },
  'navigation-menu': {
    window: true,
    widths: BOTH,
    render: () => (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-72 gap-1">
                <li>
                  <NavigationMenuLink href="#intro">Introduction</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#install">Installation</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    ),
    arrange: async () => {
      await userEvent.click(page.getByRole('button', { name: 'Getting started' }));
      await expect.element(page.getByRole('link', { name: 'Installation' })).toBeVisible();
      return undefined;
    },
  },
  pagination: {
    widths: BOTH,
    render: () => (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#prev" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#2" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#next" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    ),
  },
  popover: {
    window: true,
    render: () => (
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>Dimensions</PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>Set the layer's size.</PopoverDescription>
          </PopoverHeader>
          <Input aria-label="Width" defaultValue="100%" />
        </PopoverContent>
      </Popover>
    ),
    arrange: () => open('button', 'Dimensions').then(() => shown('dialog')),
  },
  progress: {
    render: () => <Progress value={60} aria-label="Upload" className="max-w-sm" />,
  },
  'radio-group': {
    render: () => (
      <RadioGroup defaultValue="comfortable">
        {['default', 'comfortable', 'compact'].map((value) => (
          <div key={value} className="flex items-center gap-2">
            <RadioGroupItem value={value} id={`radio-${value}`} />
            <Label htmlFor={`radio-${value}`}>{value}</Label>
          </div>
        ))}
      </RadioGroup>
    ),
  },
  resizable: {
    render: () => (
      <ResizablePanelGroup orientation="horizontal" className="h-32 max-w-md rounded-lg border">
        <ResizablePanel defaultSize="50%">
          <div className="flex h-full items-center justify-center">One</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="50%">
          <div className="flex h-full items-center justify-center">Two</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    ),
  },
  'scroll-area': {
    render: () => (
      <ScrollArea className="h-40 w-48 rounded-md border">
        <div className="p-4">
          {Array.from({ length: 20 }, (_, index) => (
            <div key={index} className="text-sm">
              v1.2.0-beta.{index}
            </div>
          ))}
        </div>
      </ScrollArea>
    ),
  },
  select: {
    window: true,
    render: () => (
      <Select items={FRUITS.map((fruit) => ({ label: fruit, value: fruit }))}>
        <SelectTrigger aria-label="Fruit" className="w-48">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {FRUITS.map((fruit) => (
              <SelectItem key={fruit} value={fruit}>
                {fruit}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    ),
    arrange: () => open('combobox', 'Fruit').then(() => shown('listbox')),
  },
  separator: {
    render: () => (
      <div className="flex h-8 max-w-sm items-center gap-3">
        Blog
        <Separator orientation="vertical" />
        Docs
        <Separator orientation="vertical" />
        Source
      </div>
    ),
  },
  sheet: {
    window: true,
    widths: BOTH,
    render: () => (
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Narrow the list.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    ),
    arrange: () => open('button', 'Open sheet').then(() => shown('dialog')),
  },
  sidebar: {
    window: true,
    widths: BOTH,
    render: () => (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>Acme</SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {['Inbox', 'Drafts', 'Sent'].map((title) => (
                    <SidebarMenuItem key={title}>
                      <SidebarMenuButton isActive={title === 'Inbox'}>{title}</SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger />
        </SidebarInset>
      </SidebarProvider>
    ),
  },
  skeleton: {
    render: () => (
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="grid gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    ),
  },
  slider: {
    render: () => <Slider defaultValue={[40]} aria-label="Volume" className="max-w-sm" />,
  },
  sonner: {
    window: true,
    render: () => <Toaster />,
    arrange: async () => {
      toast.dismiss();
      toast('Event created', { description: 'Friday at noon', duration: Number.POSITIVE_INFINITY });
      await expect.element(page.getByText('Event created')).toBeVisible();
      return undefined;
    },
  },
  spinner: {
    render: () => <Spinner />,
  },
  switch: {
    render: () => (
      <Row>
        <Switch aria-label="Off" />
        <Switch aria-label="On" defaultChecked />
        <Switch aria-label="Disabled" disabled />
      </Row>
    ),
  },
  table: {
    render: () => (
      <Table className="max-w-md">
        <TableCaption>Recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            ['INV001', 'Paid', '$250.00'],
            ['INV002', 'Pending', '$150.00'],
          ].map(([invoice, status, amount]) => (
            <TableRow key={invoice}>
              <TableCell>{invoice}</TableCell>
              <TableCell>{status}</TableCell>
              <TableCell className="text-right">{amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
  },
  tabs: {
    render: () => (
      <div className="grid gap-4">
        {(['default', 'line'] as const).map((variant) => (
          <Tabs key={variant} defaultValue="account">
            <TabsList variant={variant}>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">Make changes to your account.</TabsContent>
          </Tabs>
        ))}
      </div>
    ),
  },
  textarea: {
    render: () => <Textarea aria-label="Message" defaultValue="Type your message here." className="max-w-sm" />,
  },
  'toggle-group': {
    render: () => (
      <ToggleGroup defaultValue={['bold']} variant="outline">
        <ToggleGroupItem value="bold" aria-label="Bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          <ItalicIcon />
        </ToggleGroupItem>
      </ToggleGroup>
    ),
  },
  toggle: {
    render: () => (
      <Row>
        <Toggle aria-label="Bold">
          <BoldIcon />
        </Toggle>
        <Toggle aria-label="Italic" defaultPressed variant="outline">
          <ItalicIcon />
        </Toggle>
        <Toggle size="sm" aria-label="Next">
          <ChevronRightIcon />
        </Toggle>
      </Row>
    ),
  },
  tooltip: {
    window: true,
    render: () => (
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>Hover</TooltipTrigger>
        <TooltipContent>Add to library</TooltipContent>
      </Tooltip>
    ),
    arrange: async () => {
      await userEvent.hover(page.getByRole('button', { name: 'Hover' }));
      return shown('tooltip');
    },
  },
} satisfies Record<string, Omit<VisualSubject, 'name'>>;

/** The primitives with no capture of their own, each with what it draws instead. */
const UNDRAWN: Record<string, string> = {
  direction: 'a provider with no surface; the items under it are captured',
  highlighter: 'its strokes are drawn at random on each mount, so no two captures match',
};

describeVisual(
  'every primitive',
  Object.entries(SUBJECTS).map(([name, subject]) => ({ name, ...subject })),
);

describe('the primitives gallery', () => {
  it('draws every primitive the registry ships', () => {
    const files = Object.keys(import.meta.glob(['./*.tsx', '!./*.spec.tsx'])).map((path) =>
      path.slice('./'.length, -'.tsx'.length),
    );
    expect(files.filter((name) => !(name in SUBJECTS) && !(name in UNDRAWN))).toEqual([]);
  });
});
