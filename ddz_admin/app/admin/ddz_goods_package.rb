ActiveAdmin.register DdzGoodsPackage do

  collection_action :refresh_packages, :method => :get do
    # Do some CSV importing work here...
    PubSubEvent.create({
                           eventName: 'reload_cache',
                           eventData: {reloadTarget: 'packages'},
                           active: 1
                       })
    redirect_to({:action => :index}, {:notice => "Post Packages refresh event successfully!"})
  end

  sidebar :operation do
    ul do
      li link_to "Refresh Packages in GAME SERVER", refresh_packages_admin_ddz_goods_packages_path
    end
  end


  permit_params do
    permitted = []
    permitted << :packageId
    permitted << :packageName
    permitted << :packageDesc
    permitted << :packageType
    permitted << :packageIcon
    permitted << :price
    permitted << :enabled
    permitted << :sortIndex
    permitted
  end

  index do
    selectable_column
    id_column
    column :packageId
    column :packageName
    column :packageDesc
    column :packageType
    column :packageIcon
    column :price
    column :enabled
    column :sortIndex
    column :created_at
    column :updated_at
    actions
  end

  filter :packageId
  filter :packageName
  filter :packageDesc
  filter :packageType

  form do |f|
    f.inputs "DdzGoodsPackage Details" do
      f.input :packageId
      f.input :packageName
      f.input :packageDesc
      f.input :packageType
      f.input :packageIcon
      f.input :price
      f.input :enabled
      #f.input :goodsProps
      f.input :sortIndex
    end

    panel "goods" do
      table_for DdzGoods.all.sort(sortIndex: 1) do
        column "Goods Id", :id
        column "Goods Name", :goodsName
        column "In Package" do |goods|
          check_box_tag("in_package[]", goods.id)
        end
        column "count", :goodsCount do |goods|
          text_field_tag("#{goods.id}_count")
        end
        column "Sort Index", :sortIndex do |goods|
          number_field_tag("#{goods.id}_sortIndex", in: 0..255)
        end
      end

    end

    f.actions
  end

  member_action :update_items, :method => :post do

  end

  show do |goodsPkg|

    attributes_table do
      row :id
      row :packageId
      row :packageName
      row :packageDesc
      row :packageType
      row :packageIcon
      row :price
      row :sortIndex
      row :created_at
      row :updated_at
    end

    panel "goods items" do
      table_for goodsPkg.items do
        column "Goods Id", :goodsId
        column "Goods Name" do |item|
          item.goods.goodsName
        end
        column "count", :goodsCount
        column "Sort Index", :sortIndex
      end

    end

  end

  controller do
    def update(options={}, &block)
      object = resource

      goods_ids = params[:in_package]
      object.items.clear
      items_attrs = []
      goods_ids.each do |gid|
        items_attrs << {goodsId: gid, goodsCount: params["#{gid}_count"], sortIndex: params["#{gid}_sortIndex"]}
      end
      object.items_attributes = items_attrs

      super(options, &block)
    end
  end
end
