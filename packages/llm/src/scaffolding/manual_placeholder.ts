export function generateManualPlaceholder(
  componentName: string,
  reason: string,
  originalNodeId: string,
): string {
  return `import React from 'react';

export const ${componentName} = () => {
  return (
    <div className="border-4 border-red-500 bg-red-100 p-8 my-4 text-red-900 rounded">
      <h2 className="text-2xl font-black">Manual Migration Required</h2>
      <p>
        <strong>Reason:</strong> ${reason}
      </p>
      <p>
        <strong>Node Ref:</strong> ${originalNodeId}
      </p>
    </div>
  );
};
`;
}
